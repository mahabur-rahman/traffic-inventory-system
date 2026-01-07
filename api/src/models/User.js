module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
      }
    },
    {
      tableName: "users",
      underscored: true,
      timestamps: true
    }
  );

  return User;
};

