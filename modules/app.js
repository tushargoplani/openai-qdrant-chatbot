const {
  apiFailureMessage,
  apiSuccessMessage,
  fileContants,
} = require("../common/constants");
const { IncomingForm } = require("formidable");
const reader = require("any-text");
const path = require("path");
const EmbeddingsModule = require("./embeddings");
const AppModel = require('../models/app');
const FileModel = require('../models/file');

class AppModule {
  createApp = async (req, res) => {
    try {
      const files = await this.parseFormData(req);
      if (!files || !files.file || !files.file[0] || !files.file[0].filepath)
        return res
          .status(400)
          .send({ message: apiFailureMessage.FILE_IS_REQUIRED, statusCode: 400 });
        
      let app = await new AppModel(req.query);

      for (const file of files.file) {
        let fileExtension = path.extname(path.basename(file.filepath));
        const extractedData = await this.readFileContent(
          { path: file.filepath },
          fileExtension
        );

        const embeddings = await EmbeddingsModule.createEmbeddings(extractedData, file.originalFilename);
        const fileRes = await new FileModel({
          appId: app._id,
          originalFile: file.filepath,
          embeddings: embeddings,
        }).save();
       
        app.fileIds.push(fileRes._id);
      }

      res.json({
        response: await app.save(),
        message: apiSuccessMessage.APP_CREATED_SUCCESSFULLY,
        statusCode: 200,
      });
    } catch (error) {
      res.status(500).send(error);
    }
  };

  parseFormData = (data) => {
    return new Promise((resolve, reject) => {
      const form = new IncomingForm({
        keepExtensions: true,
        multiples: true,
        uploadDir: path.join(__dirname, "../common/originalFiles"),
      });
      form.parse(data, (err, fields, files) => {
        if (err) return reject(err);
        if (!Array.isArray(files.file)) files.file = [files.file];
        resolve(files);
      });
    });
  };

  readFileContent = async (file, fileExt) => {
    const validTypes = fileContants.VALID_FILE_TYPES;
    try {
      if (!validTypes.includes(fileExt)) {
        throw {
          message: apiFailureMessage.INVALID_FILE_EXTENSION,
          statusCode: 400,
        };
      }

      return await reader.getText(file.path);
    } catch (error) {
      throw error;
    }
  };
}

module.exports = new AppModule();
