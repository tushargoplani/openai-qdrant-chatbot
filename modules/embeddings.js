const { apiFailureMessage, openAIConstants } = require("../common/constants");
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY });
const openai = new OpenAIApi(configuration);
const AxiosService = require("../service/axios");

class EmbdeddingModule {
  createEmbeddings = async (data, fileName) => {
    try {
      const textLength = data.length;
      if (textLength < 20)
        throw {
          message: apiFailureMessage.NO_TEXT_IN_IMPORT,
          statusCode: 400,
        };
      if (textLength > openAIConstants.MAX_CHARACTERS_LENGTH)
        throw {
          message: apiFailureMessage.TEXT_TOO_LARGE,
          statusCode: 400,
        };

      const embeddings = await this.generateEmbedding({
        rawText: data,
        fileName,
      });
      return embeddings;
    } catch (error) {
      throw error || "Failed to create embeddings";
    }
  };

  generateEmbedding = async ({ rawText, fileName }) => {

    const minParaWords = 5;

    let paras = [];
    try {
      let rawParas = rawText.split(/\n\s*\n/);

      let tempText = "";

      for (let i = 0; i < rawParas.length; i++) {
        let rawPara = rawParas[i]
          .trim()
          .replaceAll("\n", " ")
          .replace(/\r/g, "");

        if (rawPara.charAt(rawPara.length - 1) != "?") {
          if (!rawPara) continue;
          if (rawPara.split(/\s+/).length >= minParaWords) {
            if (tempText) {
              paras = paras.concat(
                await this.createSentenceChunks(
                  tempText +
                    rawPara +
                    " " +
                    `\nReference from file ${fileName}. `
                )
              );
              tempText = "";
            } else {
              paras = paras.concat(
                await this.createSentenceChunks(
                  rawPara + " " + `\nReference from file ${fileName}. `
                )
              );
            }
          } else {
            tempText += " " + rawPara;
          }
        }
      }

      const response = await this.splitAndCreateEmbedding(paras);

      const headers = { "api-key": process.env.QDRANT_API_KEY };
      const collectionInfo = await AxiosService.executeHTTPRequest(
        "GET",
        process.env.QDRANT_CLUSTER_CONNECTION_STRING,
        "/collections/embeddings",
        headers,
        {}
      );
      const pointsCount = collectionInfo.result.points_count;

      let request = await Promise.all(
        response.map((data) => {
          return { id: data.index + pointsCount, vector: data.embedding, payload: { text: paras[data.index] } };
        })
      );
      request = { points: request };
      const insertPoints = await AxiosService.executeHTTPRequest(
        "PUT",
        process.env.QDRANT_CLUSTER_CONNECTION_STRING,
        "/collections/embeddings/points?wait=true",
        headers,
        request
      );
      if (!insertPoints.status == "ok")
        throw {
          message: apiFailureMessage.FAILED_TO_STORE_EMBEDDINGS,
          statusCode: 500,
        };

      const pointIds = [];
      request.points.forEach((point) => {
        pointIds.push(point.id);
      });
      return { pointIds}
    } catch (error) {
      let errorMessage =
        error &&
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.message;

      if (errorMessage.length > 300)
        errorMessage = "Failed to generate embeddings";

      throw {
        message:
          errorMessage ||
          (error && error.message) ||
          "Failed to generate embeddings",
        statusCode: 400,
      };
    }
  };

  createSentenceChunks = async (
    text,
    minChunkSize = openAIConstants.MIN_CHUNK_SIZE,
    maxChunkSize = openAIConstants.MAX_CHUNK_SIZE
  ) => {
    const sentenceEnders = [". "];
    const chunks = [];
    let currentChunk = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      currentChunk += char;

      if (
        sentenceEnders.includes(currentChunk.slice(-2)) &&
        currentChunk.length >= minChunkSize &&
        currentChunk.length <= maxChunkSize
      ) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      } else if (currentChunk.length > maxChunkSize) {
        if (currentChunk.includes(". ")) {
          const lastPeriodIndex = currentChunk.lastIndexOf(". ");
          chunks.push(currentChunk.slice(0, lastPeriodIndex + 1).trim());
          currentChunk = currentChunk.slice(lastPeriodIndex + 1);
        } else {
          const commaIndex = currentChunk.lastIndexOf(",");
          if (commaIndex !== -1) {
            chunks.push(currentChunk.slice(0, commaIndex + 1).trim());
            currentChunk = currentChunk.slice(commaIndex + 1);
          }
        }
      }
    }

    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

    return chunks;
  };

  splitAndCreateEmbedding = async (
    paragraphs,
    batchSize = openAIConstants.CHUNKS_BATCH_SIZE
  ) => {
    const splittedParas = [];
    let response = [];

    for (let i = 0; i < paragraphs.length; i += batchSize) {
      const splitted = paragraphs.slice(i, i + batchSize);
      splittedParas.push(splitted);
    }

    for (let j = 0; j < splittedParas.length; j++) {
      const subParas = splittedParas[j];

      const { data } = await openai.createEmbedding(
        {
          input: subParas,
          model: openAIConstants.EMBED_MODEL,
        },
        { timeout: 1000 * 100 }
      );

      response = response.concat(data.data);
    }
    return response;
  };
}

module.exports = new EmbdeddingModule();
