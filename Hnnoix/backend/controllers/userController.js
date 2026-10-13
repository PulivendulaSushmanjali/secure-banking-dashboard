class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = req.user;
      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
