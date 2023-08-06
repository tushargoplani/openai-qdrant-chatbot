exports.apiFailureMessage = {
    FILE_IS_REQUIRED: 'File is required',
    APP_NOT_FOUND: 'App not found',
    INVALID_FILE_EXTENSION: 'Invalid File Extension',
    NO_TEXT_IN_IMPORT: 'Text Not Recognized. Double-check your imports and try again.',
    TEXT_TOO_LARGE: 'Your imported content is too large. Please consider reducing it.',
    FAILED_TO_GET_POINTS: 'Failed to get points',
    FAILED_TO_STORE_EMBEDDINGS: 'Failed to store embeddings',
}

exports.apiSuccessMessage = {
    APP_CREATED_SUCCESSFULLY: 'App created successfully',
}

exports.fileContants = {
    VALID_FILE_TYPES: ['.pdf', '.csv'],
}

exports.openAIConstants = {
    EMBED_MODEL: 'text-embedding-ada-002',
    BASIC_CHAT_MODEL: 'gpt-3.5-turbo',
    TEMPERATURE: 0.7,
    MAX_LENGTH: 6000,
    MAX_CHUNK_SIZE: 1200,
    MIN_CHUNK_SIZE: 350,
    MAX_CONTEXT_SIZE: 1500,
    CHUNKS_BATCH_SIZE: 1000,
    MAX_CHARACTERS_LENGTH: 2500000,
  };