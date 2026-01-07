/* eslint-disable no-undef */

import devCerts from "office-addin-dev-certs";
import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
 
// ============================================================================
// 🚀 CONFIGURACIÓN DE PRODUCCIÓN (Por defecto)
// ============================================================================
// Este proyecto está configurado para PRODUCCIÓN por defecto.
// Las URLs apuntan a los servicios desplegados en Azure.

// 📝 Para probar LOCALMENTE:
// 1. Cambia las URLs de producción por las de desarrollo (comentadas abajo)
// 2. Ejecuta: npm run dev-server
// 3. NO OLVIDES revertir los cambios antes de hacer commit

// URLs de PRODUCCIÓN (Azure)
const urlProd = "https://gentle-ground-0e6ae2a1e.1.azurestaticapps.net/";
const apiUrlProd = "https://ca-addin-rpa-backend-1.nicemushroom-236103a4.brazilsouth.azurecontainerapps.io";

// URLs de DESARROLLO LOCAL (descomentadas solo para pruebas locales)
const urlDev = "https://localhost:3000/";
const apiUrlDev = "http://localhost:3001";

// ============================================================================

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

export default async (env, options) => {
  const dev = options.mode === "development";
  
  // SIEMPRE usar URLs de producción (incluso en modo development)
  // Para desarrollo local, cambia manualmente las URLs arriba
  const apiUrl = apiUrlProd;
  
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/taskpane/taskpane.js", "./src/taskpane/taskpane.html"],
      commands: "./src/commands/commands.js",
    },
    output: {
      clean: true,
    },
    resolve: {
      extensions: [".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      // Inyectar variables de entorno globales
      // RPA_API_URL será reemplazado en el código con la URL del backend de producción
      new webpack.DefinePlugin({
        'RPA_API_URL': JSON.stringify(apiUrl),
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane"],
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/index.html",
        chunks: [],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
    ],
    devServer: {
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
