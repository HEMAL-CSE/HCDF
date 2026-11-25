
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
  "DB_HOST",
  "DB_PORT",
  "DB_NAME",
  "DB_USER",
  "DB_PASSWORD"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing environment variable: ${variable}`);
  }
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",

    logging: false,

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },

    define: {
      timestamps: true,
      underscored: true
    }
  }
);

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log("=================================");
    console.log("HCDF DATABASE CONNECTED");
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log("=================================");

  } catch (error) {
    console.error("HCDF DATABASE CONNECTION FAILED");
    console.error(error.message);

    throw error;
  }
};

export default sequelize;

