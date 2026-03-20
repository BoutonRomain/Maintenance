import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  define: {
    timestamps: false,
  },
  storage: "./db.sqlite",
});

export default sequelize;