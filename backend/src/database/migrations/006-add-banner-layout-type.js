import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  const tableDesc = await queryInterface.describeTable("home_hero_banners");
  if (!tableDesc.layout_type) {
    await queryInterface.addColumn("home_hero_banners", "layout_type", {
      type: DataTypes.ENUM("BACKGROUND", "SIDE_BY_SIDE"),
      allowNull: false,
      defaultValue: "BACKGROUND",
      after: "cta_link"
    });
  }
}

export async function down({ context: queryInterface }) {
  const tableDesc = await queryInterface.describeTable("home_hero_banners");
  if (tableDesc.layout_type) {
    await queryInterface.removeColumn("home_hero_banners", "layout_type");
  }
}
