const { uploadMediaToCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');
const Media = require('../models/Media');

const uploadMedia = async (req, res) => {
  logger.info('Starting media upload');

  try {
    // 🔍 Debug once (can remove later)
    console.log(req.file, 'req.file');

    if (!req.file) {
      logger.error('No file found. Please add a file and try again!');
      return res.status(400).json({
        success: false,
        message: 'No file found. Please add a file and try again!',
      });
    }

    // ✅ CORRECT Multer field names
    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(`File details: name=${originalname}, type=${mimetype}`);
    logger.info('Uploading to cloudinary starting...');

    // ☁️ Upload to Cloudinary
    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `Cloudinary upload successful. Public Id: ${cloudinaryUploadResult.public_id}`
    );

    // 💾 Save to MongoDB
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname, // 🔥 FIX
      mimeType: mimetype,         // 🔥 FIX
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: 'Media upload successful',
    });
  } catch (error) {
    logger.error('Error creating media', error);
    res.status(500).json({
      success: false,
      message: 'Error creating media',
    });
  }
};

const getAllMedias = async(req,res) => {
  try{
    const results = await Media.find({});
    res.json({results});
  }catch(error){
    logger.error("Error fetching medias", error);
    res.status(500).json({
      success : false,
      message : "Error fetching media"
    })
  }
}

module.exports = { uploadMedia,getAllMedias };
