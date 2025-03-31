const mongoose = require("mongoose");
const Admin = mongoose.model("Admin");

// ✅ List all admins with pagination
exports.list = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.items) || 10;
  const skip = page * limit - limit;

  try {
    const resultsPromise = Admin.find()
      .skip(skip)
      .limit(limit)
      .sort({ created: "desc" }); // Remove `.populate()` unless you're populating specific fields

    const countPromise = Admin.countDocuments();

    const [result, count] = await Promise.all([resultsPromise, countPromise]);

    const pages = Math.ceil(count / limit);
    const pagination = { page, pages, count };

    // Remove passwords from results
    for (let admin of result) {
      admin.password = undefined;
    }

    return res.status(200).json({
      success: true,
      result,
      pagination,
      message: "Successfully found all documents",
    });
  } catch (err) {
    console.error("❌ Admin list error:", err.message);
    return res.status(500).json({
      success: false,
      result: [],
      message: "Oops there is an Error",
    });
  }
};

// ✅ Read single admin profile (from token/session)
exports.profile = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "Couldn't find admin profile",
      });
    }

    const result = {
      _id: req.admin._id,
      enabled: req.admin.enabled,
      email: req.admin.email,
      name: req.admin.name,
      surname: req.admin.surname,
    };

    return res.status(200).json({
      success: true,
      result,
      message: "Successfully found Profile",
    });
  } catch (err) {
    console.error("❌ Admin profile error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

// ✅ Read admin by ID
exports.read = async (req, res) => {
  try {
    const admin = await Admin.findOne({ _id: req.params.id });
    if (!admin) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "No document found by this id: " + req.params.id,
      });
    }

    const result = {
      _id: admin._id,
      enabled: admin.enabled,
      email: admin.email,
      name: admin.name,
      surname: admin.surname,
    };

    return res.status(200).json({
      success: true,
      result,
      message: "Found the admin by ID",
    });
  } catch (err) {
    console.error("❌ Admin read error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

// ✅ Create new admin
exports.create = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Email or password is missing",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "Password must be at least 8 characters long",
      });
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        result: null,
        message: "An account with this email already exists",
      });
    }

    const newAdmin = new Admin();
    const passwordHash = newAdmin.generateHash(password);
    req.body.password = passwordHash;

    const savedAdmin = await new Admin(req.body).save();

    return res.status(200).json({
      success: true,
      result: {
        _id: savedAdmin._id,
        enabled: savedAdmin.enabled,
        email: savedAdmin.email,
        name: savedAdmin.name,
        surname: savedAdmin.surname,
      },
      message: "Admin created successfully",
    });
  } catch (err) {
    console.error("❌ Admin create error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Server error while creating admin",
    });
  }
};

// ✅ Update admin by ID
exports.update = async (req, res) => {
  try {
    const { email } = req.body;

    if (email) {
      const existing = await Admin.findOne({ email });
      if (existing && existing._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }
    }

    const updates = {
      email: req.body.email,
      role: req.body.role,
      name: req.body.name,
      surname: req.body.surname,
    };

    const result = await Admin.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      { new: true }
    ).exec();

    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "No document found by this id: " + req.params.id,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        _id: result._id,
        enabled: result.enabled,
        email: result.email,
        name: result.name,
        surname: result.surname,
      },
      message: "Admin updated successfully",
    });
  } catch (err) {
    console.error("❌ Admin update error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

// ✅ Update admin password
exports.updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const admin = new Admin();
    const hashed = admin.generateHash(password);

    const updated = await Admin.findOneAndUpdate(
      { _id: req.params.id },
      { $set: { password: hashed } },
      { new: true }
    ).exec();

    if (!updated) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "No document found by this id: " + req.params.id,
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        _id: updated._id,
        enabled: updated.enabled,
        email: updated.email,
        name: updated.name,
        surname: updated.surname,
      },
      message: "Password updated successfully",
    });
  } catch (err) {
    console.error("❌ Admin password update error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

// ✅ Delete admin
exports.delete = async (req, res) => {
  try {
    const result = await Admin.findOneAndDelete({ _id: req.params.id }).exec();
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: "No document found by this id: " + req.params.id,
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: "Successfully deleted admin",
    });
  } catch (err) {
    console.error("❌ Admin delete error:", err.message);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Oops there is an Error",
    });
  }
};

// ✅ Search admins
exports.search = async (req, res) => {
  try {
    if (!req.query.q || !req.query.fields) {
      return res.status(202).json({
        success: false,
        result: [],
        message: "No document found by this request",
      });
    }

    const fieldsArray = req.query.fields.split(",");
    const conditions = { $or: [] };

    for (const field of fieldsArray) {
      conditions.$or.push({
        [field]: { $regex: new RegExp(req.query.q, "i") },
      });
    }

    const result = await Admin.find(conditions)
      .where("removed", false)
      .sort({ name: "asc" })
      .limit(10);

    if (result.length) {
      return res.status(200).json({
        success: true,
        result,
        message: "Successfully found matching admins",
      });
    } else {
      return res.status(202).json({
        success: false,
        result: [],
        message: "No document found by this request",
      });
    }
  } catch (err) {
    console.error("❌ Admin search error:", err.message);
    return res.status(500).json({
      success: false,
      result: [],
      message: "Oops there is an Error",
    });
  }
};
