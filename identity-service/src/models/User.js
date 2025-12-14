const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
    /*
    pre("save", ...) is a Mongoose middleware.

It runs before a document is saved (save() method is called).

You can modify the document before it actually gets saved to the database.

In your case, you’re using it to hash passwords before saving.
    */
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password);//this refers to the current document being saved (e.g., a user instance).
    } catch (error) {
      return next(error);
    }
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    throw error;
  }
};

userSchema.index({ username: "text" });//Improves search performance on usernames with full-text search.

const User = mongoose.model("User", userSchema);
module.exports = User;