import { Sequelize } from "sequelize";
import "dotenv/config";
import { canTreatArrayAsAnd } from "sequelize/lib/utils";

export const sequelise = new Sequelize(
  process.env.DBNAME,
  process.env.DBUSER,
  process.env.DBPASSWORD,
  {
    host: "localhost",
    dialect: "postgres",
    logging: false,
  },
);

export const connectDB = async () => {
  try {
    await sequelise.authenticate();
    await sequelise.sync();
    console.log("DATABASE IS CONNECTED!!!");
  } catch (e) {
    console.log("DATABASE CONNECTION ERROR - " + e.message);
  }
};
