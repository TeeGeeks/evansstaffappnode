const { Model } = require("sequelize");
const Sequelize = require("sequelize");
const sequelize = require("../util/database");

class TokenPass extends Model {}

TokenPass.init(
  {
    token: { type: Sequelize.STRING, required: true },
    signedAt: { type: Sequelize.DATE, required: true },
    staffId: { type: Sequelize.STRING, required: true, allowNull: false },
  },
  {
    sequelize,
    createdAt: true,
    updatedAt: true,
    timestamps: true,
    modelName: "token",
  }
);

module.exports = TokenPass;
