const { apiFailureMessage, openAIConstants } = require("../common/constants");
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY });
const openai = new OpenAIApi(configuration);
const fs = require("fs");
const AppModel = require("../models/app");
const FileModel = require("../models/file");
const QueryModel = require("../models/query");
const AxiosService = require("../service/axios");

class ChatModule {
  query = async (req, res) => {
    try {
      const { appId, question } = req.body;
      const appResponse = await AppModel.findOne({
        _id: appId,
        isActive: true,
      }).lean();
      if (!appResponse)
        throw { message: apiFailureMessage.APP_NOT_FOUND, statusCode: 404 };
      const imports = await FileModel.find({
        appId: appId,
        isActive: true,
      }).lean();

      let pointIds = [];
      imports.forEach((data) => {
        pointIds.push(...data.embeddings.pointIds);
      });

      const questionEmbeddings = await this.createEmbedding(question);
      const body = {
        vector: questionEmbeddings,
        limit: 5,
        with_payload: true,
        filter: {
          must: [
            {
              has_id: pointIds,
            },
          ],
        },
      };
      const headers = { "api-key": process.env.QDRANT_API_KEY };
      const qdrantRes = await AxiosService.executeHTTPRequest(
        "POST",
        process.env.QDRANT_CLUSTER_CONNECTION_STRING,
        "/collections/embeddings/points/search",
        headers,
        body
      );
      if (!qdrantRes.status == "ok")
        throw {
          message: apiFailureMessage.FAILED_TO_GET_POINTS,
          statusCode: 500,
        };

      let contexts = "";
      if (qdrantRes.result.length) {
        let currentTokenSize = 0;
        const contextMaxSize = openAIConstants.MAX_CONTEXT_SIZE;
        for (const chunk of qdrantRes.result) {
          let trimText = chunk.payload.text.trim();
          currentTokenSize += trimText.length;
          contexts += trimText + "\n\n";
          if (currentTokenSize > contextMaxSize) break;
        }
      }

      const system = {
        role: "system",
        content: `I am Insynk bot, a helpful assistant who is trained to answer queries based on the given context.`,
      };

      const conversation = [
        {
          role: "user",
          content:
            "Question :\n" + question + "? " + "\n\n Context : " + contexts,
        },
      ];

      const answer = await this.chatCompletion({
        system,
        messages: conversation,
      });

      await new QueryModel({
        question,
        answer,
        appId,
        context: contexts,
      }).save();

      res.json({
        response: answer,
        message: "Query Success",
        statusCode: 200,
      });
    } catch (error) {
      res.status(500).send(error);
    }
  };

  readAllFilesData = async (paths) => {
    return Promise.all(
      paths.map(async (filePath) => {
        const data = fs.readFileSync(filePath, {
          encoding: "utf-8",
          flag: "r",
        });
        return JSON.parse(data);
      })
    );
  };

  createEmbedding = async (input) => {
    try {
      const response = await openai.createEmbedding({
        input,
        model: openAIConstants.EMBED_MODEL,
      });
      if (!response.data.data.length)
        throw Error("Question not embedded properly");
      return response.data.data[0].embedding;
    } catch (error) {
      throw error;
    }
  };

  chatCompletion = async ({
    system,
    messages,
  }) => {
    const { BASIC_CHAT_MODEL, TEMPERATURE } = openAIConstants;
    const model = BASIC_CHAT_MODEL;
    const maxTokens = 700;
    const options = { temperature: TEMPERATURE, max_tokens: maxTokens, n: 1 };
    try {
      let { data } = await openai.createChatCompletion(
        {
          model: model,
          messages: [system, ...messages],
          ...options,
        },
        { responseType: "json" }
      );

      return data.choices[0].message.content;
    } catch (error) {
      return `I apologize that I couldn't find a specific answer to your question. To assist you better, could you please provide additional details or clarify your question? The more specific information you provide, the more accurate and helpful my response can be.`;
    }
  };
}

module.exports = new ChatModule();
