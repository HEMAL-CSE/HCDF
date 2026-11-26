import { DataTypes, QueryTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  const sequelize = queryInterface.sequelize;

  await sequelize.transaction(async (transaction) => {
    const existingTables = new Set((await queryInterface.showAllTables()).map((t) => String(t).toLowerCase()));

    if (!existingTables.has("home_hero_banners")) {
      await queryInterface.createTable(
      "home_hero_banners",
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        subtitle: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        image_url: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        cta_label: {
          type: DataTypes.STRING(80),
          allowNull: true
        },
        cta_link: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        sort_order: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        updated_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      { transaction }
    );

    await queryInterface.addIndex("home_hero_banners", ["is_active", "sort_order"], {
      name: "idx_home_hero_banners_active_order",
      transaction
    });
    }

    if (!existingTables.has("home_content_items")) {
    await queryInterface.createTable(
      "home_content_items",
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        section_type: {
          type: DataTypes.ENUM("ABOUT", "PROGRAMME", "IMPACT", "TICKER"),
          allowNull: false
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        subtitle: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        metric_value: {
          type: DataTypes.STRING(60),
          allowNull: true
        },
        icon: {
          type: DataTypes.STRING(60),
          allowNull: true
        },
        image_url: {
          type: DataTypes.STRING(500),
          allowNull: true
        },
        cta_label: {
          type: DataTypes.STRING(80),
          allowNull: true
        },
        cta_link: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        sort_order: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        created_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        updated_by: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: true
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false
        }
      },
      { transaction }
    );

    await queryInterface.addIndex("home_content_items", ["section_type", "is_active", "sort_order"], {
      name: "idx_home_content_section_active_order",
      transaction
    });
    }

    const now = new Date();

    // Add cms.manage permission for SA and AD if permissions table exists
    const existingPerm = await sequelize.query(
      "SELECT id FROM permissions WHERE code = 'cms.manage' LIMIT 1",
      { type: QueryTypes.SELECT, transaction }
    );

    let permId = existingPerm[0]?.id;
    if (!permId) {
      await queryInterface.bulkInsert(
        "permissions",
        [{
          code: "cms.manage",
          name: "Manage home page banners and content",
          module: "cms",
          description: "Create, edit, reorder, and toggle public home page content",
          created_at: now,
          updated_at: now
        }],
        { transaction }
      );
      const inserted = await sequelize.query(
        "SELECT id FROM permissions WHERE code = 'cms.manage' LIMIT 1",
        { type: QueryTypes.SELECT, transaction }
      );
      permId = inserted[0]?.id;
    }

    if (permId) {
      const targetRoles = await sequelize.query(
        "SELECT id FROM roles WHERE code IN ('SA', 'AD')",
        { type: QueryTypes.SELECT, transaction }
      );
      for (const role of targetRoles) {
        const mapped = await sequelize.query(
          "SELECT id FROM role_permissions WHERE role_id = :roleId AND permission_id = :permId LIMIT 1",
          { replacements: { roleId: role.id, permId }, type: QueryTypes.SELECT, transaction }
        );
        if (!mapped.length) {
          await queryInterface.bulkInsert(
            "role_permissions",
            [{ role_id: role.id, permission_id: permId, created_at: now, updated_at: now }],
            { transaction }
          );
        }
      }
    }

    // Seed initial default hero banners if empty
    const bannerCountRows = await sequelize.query(
      "SELECT COUNT(*) AS total FROM home_hero_banners",
      { type: QueryTypes.SELECT, transaction }
    );
    if (Number(bannerCountRows[0]?.total || 0) === 0) {
      await queryInterface.bulkInsert(
      "home_hero_banners",
      [
        {
          title: "Uplifting Lives with Dignity & Compassion",
          subtitle: "Human Charity Dignity Foundation (HCDF) empowers vulnerable families, meritorious students, and rural communities through sustainable humanitarian programmes.",
          image_url: null,
          cta_label: "Become a Member",
          cta_link: "/register",
          sort_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          title: "Empowering Youth Through Education & Skills",
          subtitle: "From scholarships and community learning centres to vocational training, we invest in long-term self-reliance across communities.",
          image_url: null,
          cta_label: "Member Portal",
          cta_link: "/member/login",
          sort_order: 2,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          title: "Rapid Humanitarian Relief When It Matters Most",
          subtitle: "Delivering emergency food, clean water, shelter, and healthcare support with 100% transparent accountability.",
          image_url: null,
          cta_label: "Join Our Mission",
          cta_link: "/register",
          sort_order: 3,
          is_active: true,
          created_at: now,
          updated_at: now
        }
      ],
      { transaction }
    );
    }

    // Seed initial default home content items if empty
    const itemCountRows = await sequelize.query(
      "SELECT COUNT(*) AS total FROM home_content_items",
      { type: QueryTypes.SELECT, transaction }
    );
    if (Number(itemCountRows[0]?.total || 0) === 0) {
      await queryInterface.bulkInsert(
      "home_content_items",
      [
        {
          section_type: "ABOUT",
          title: "A Foundation Built on Human Dignity",
          subtitle: "WHO WE ARE",
          description: "Human Charity Dignity Foundation (HCDF) is a dedicated non-profit humanitarian and social development organisation. Inspired by grassroots community welfare, we bridge immediate relief with long-term empowerment—ensuring every family, student, and elder is supported with respect, transparency, and lasting opportunity.",
          metric_value: "Since 2018",
          icon: "HeartHandshake",
          image_url: null,
          cta_label: "Register as Member",
          cta_link: "/register",
          sort_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "PROGRAMME",
          title: "Humanitarian Aid & Relief",
          subtitle: "EMERGENCY RESPONSE",
          description: "Rapid food security packages, seasonal winter relief, emergency shelter, and essential household support for families facing crisis.",
          metric_value: null,
          icon: "HeartHandshake",
          image_url: null,
          cta_label: "Support Relief",
          cta_link: "/register",
          sort_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "PROGRAMME",
          title: "Education & Talent Assistance",
          subtitle: "YOUTH EMPOWERMENT",
          description: "Scholarships, school supplies, and rural library enrichment empowering meritorious yet disadvantaged students to thrive.",
          metric_value: null,
          icon: "GraduationCap",
          image_url: null,
          cta_label: "Learn More",
          cta_link: "/register",
          sort_order: 2,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "PROGRAMME",
          title: "Community Health & Livelihoods",
          subtitle: "SUSTAINABLE GROWTH",
          description: "Primary health camps, maternal care awareness, and vocational skill-building workshops fostering self-reliant households.",
          metric_value: null,
          icon: "Stethoscope",
          image_url: null,
          cta_label: "Get Involved",
          cta_link: "/register",
          sort_order: 3,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "PROGRAMME",
          title: "Dignity & Social Rights",
          subtitle: "COMMUNITY ADVOCACY",
          description: "Protecting fundamental human dignity through community awareness, inclusive welfare access, and partner-led social support.",
          metric_value: null,
          icon: "ShieldCheck",
          image_url: null,
          cta_label: "Join HCDF",
          cta_link: "/register",
          sort_order: 4,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "IMPACT",
          title: "Lives Impacted",
          subtitle: "Across vulnerable communities",
          description: "Direct beneficiaries reached through relief and welfare initiatives",
          metric_value: "15,000+",
          icon: "Users",
          image_url: null,
          cta_label: null,
          cta_link: null,
          sort_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "IMPACT",
          title: "Active Members & Volunteers",
          subtitle: "Serving on the ground",
          description: "Dedicated members driving community programmes nationwide",
          metric_value: "5,200+",
          icon: "UserCheck",
          image_url: null,
          cta_label: null,
          cta_link: null,
          sort_order: 2,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "IMPACT",
          title: "Core Programmes",
          subtitle: "Education, health & relief",
          description: "Active humanitarian and community development tracks",
          metric_value: "12",
          icon: "Globe",
          image_url: null,
          cta_label: null,
          cta_link: null,
          sort_order: 3,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "IMPACT",
          title: "Transparent Accountability",
          subtitle: "Audited & role-governed",
          description: "Every contribution tracked with full institutional integrity",
          metric_value: "100%",
          icon: "Award",
          image_url: null,
          cta_label: null,
          cta_link: null,
          sort_order: 4,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "TICKER",
          title: "Welcome new members and volunteers to HCDF — thank you for championing human dignity.",
          subtitle: null,
          description: null,
          metric_value: null,
          icon: null,
          image_url: null,
          cta_label: null,
          cta_link: "/register",
          sort_order: 1,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "TICKER",
          title: "100% transparent humanitarian operations: every programme is tracked and verified.",
          subtitle: null,
          description: null,
          metric_value: null,
          icon: null,
          image_url: null,
          cta_label: null,
          cta_link: null,
          sort_order: 2,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "TICKER",
          title: "Education & Talent Assistance applications open for deserving students.",
          subtitle: null,
          description: null,
          metric_value: null,
          icon: null,
          image_url: null,
          cta_label: null,
          cta_link: "/register",
          sort_order: 3,
          is_active: true,
          created_at: now,
          updated_at: now
        },
        {
          section_type: "TICKER",
          title: "Approved members can sign in anytime via the HCDF Member Portal.",
          subtitle: null,
          description: null,
          metric_value: null,
          icon: null,
          image_url: null,
          cta_label: null,
          cta_link: "/member/login",
          sort_order: 4,
          is_active: true,
          created_at: now,
          updated_at: now
        }
      ],
      { transaction }
      );
    }
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.dropTable("home_content_items", { transaction });
    await queryInterface.dropTable("home_hero_banners", { transaction });
  });
}
