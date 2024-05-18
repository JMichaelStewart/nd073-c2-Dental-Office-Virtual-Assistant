const { ConversationAnalysisClient } = require('@azure/ai-language-conversations')
const { AzureKeyCredential } = require("@azure/core-auth");
class IntentRecognizer {
    constructor(config) {
        
        // Set the recognizer options depending on which endpoint version you want to use e.g v2 or v3.
        // More details can be found in https://docs.microsoft.com/en-gb/azure/cognitive-services/luis/luis-migration-api-v3
        const recognizerOptions = {
            apiVersion: 'v3'
        };

        this.recognizer = new ConversationAnalysisClient(config.CluAPIHostName, new AzureKeyCredential(config.CluAPIKey));
        this.projectName = config.CluProjectName;
        this.deploymentName = config.CluDeploymentName;
    }

    get isConfigured() {
        return (this.recognizer !== undefined);
    }

    /**
     * Returns an object with preformatted LUIS results for the bot's dialogs to consume.
     * @param {TurnContext} context
     */
    async executeCluQuery(context) {
        //This new API takes a JSON format, for this exercise I am just hardcoding some of the values. 
        return await this.recognizer.analyzeConversation({
            kind: "Conversation",
            analysisInput: {
                conversationItem: {
                    id: "id__7863",
                    participantId: "id__7863",
                    text: context.activity.text
                }
            },
            parameters: {
                projectName: this.projectName,
                deploymentName: this.deploymentName
            }
        });
    }

 
    getTimeEntity(result) {
        const entities = result.result.prediction.entities;

        let datetimeEntity = null;
        entities.forEach(item => {
            if(item.category === 'date_time') {
                datetimeEntity = item.text;
            }
        })
        if (!datetimeEntity) return undefined;

        return datetimeEntity;
    }
}

module.exports = IntentRecognizer