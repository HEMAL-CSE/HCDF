// Migration to create Home Page CMS tables
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('home_banners', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      subtitle: { type: Sequelize.STRING, allowNull: true },
      imageUrl: { type: Sequelize.STRING, allowNull: false },
      ctaText: { type: Sequelize.STRING, allowNull: true },
      ctaLink: { type: Sequelize.STRING, allowNull: true },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('home_sections', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      sectionKey: { type: Sequelize.STRING, allowNull: false, unique: true }, // e.g., 'about', 'programmes', 'impact'
      content: { type: Sequelize.JSON, allowNull: false }, // flexible JSON content
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });

    await queryInterface.createTable('home_ticker_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      text: { type: Sequelize.STRING, allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('home_ticker_items');
    await queryInterface.dropTable('home_sections');
    await queryInterface.dropTable('home_banners');
  }
};
