import * as dotenv from 'dotenv';

import express from "express";
import {StreamChat} from "stream-chat";



dotenv.config({path: ".env"})

const OPENAI_AUTHORIZATION_KEY = process.env.OPENAI_AUTHORIZATION_KEY;
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
const app = express();


configureStream(serverClient).then(_ => console.log(`Stream configured!`));

const port = 3000;

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});



app.post("/gpt-request", async (request, response, next) => {
    print('requested');
    const message = request.body.message;
    if (message.command === "gpt") {
        try {
            const text = message.args;

            const aiResponse= await openai.chat.completions.create({
                    messages: [{ role: "system", content: "You are a helpful assistant." }],
                    model: "gpt-3.5-turbo",
                  });

            if (aiResponse.status === 200) {
                const results = await aiResponse.text();
                const aiText = parseGPTResponse(results);
            
                const channelSegments = message.cid.split(":");
                const channel = serverClient.channel(channelSegments[0], channelSegments[1]);
                message.text = "";
                channel.sendMessage({
                    text: aiText,
                    user: {
                        id: "admin",
                        image: "https://openai.com/content/images/2022/05/openai-avatar.png",
                        name: "ChatGPT bot",
                    },
                }).catch((error) => console.error(error));
                response.json({
                    status: true,
                    text: "",
                });
            }
            next();
        } catch (exception) {
            console.log(`Exception Occurred`);
            console.error(exception);
        }
    }

});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  

  export async function configureStream(serverClient) {
    const {commands} = await serverClient.listCommands();
    const commandExists = commands.find((command) => command.name === "gpt");
    if (!commandExists) {
        serverClient.createCommand({
            name: "gpt",
            description: "Have a question? Ask your friendly GPT AI for help!",
            args: "[question]",
        })
            .then(_ => console.log(`Added command for Gpt`))
            .catch((err) => console.error(`Something went wrong adding Hugo custom command ${err}`));
  
        serverClient.updateAppSettings({
            custom_action_handler_url: "https://f101-66-181-164-203.ngrok-free.app",
        })
            .then(r => console.log(r))
            .catch(e => console.error(`Unable to add custom action URL ${e}`));
    }
  }

 export function parseGPTResponse(formattedString) {
    const dataChunks = formattedString.split("data:");
    const responseObjectText = dataChunks[dataChunks.length - 2].trim();
    const responseObject = JSON.parse(responseObjectText);
    return responseObject.message.content.parts[0];
  }


// import OpenAI from "openai";

// const openai = new OpenAI({apiKey:'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'});

// async function main() {
//   const completion = await openai.chat.completions.create({
//     messages: [{ role: "system", content: "You are a helpful assistant." }],
//     model: "gpt-3.5-turbo",
//   });

//   console.log(completion.choices[0]);
// }

// main();