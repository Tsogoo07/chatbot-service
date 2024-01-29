import * as dotenv from 'dotenv';
import express from "express";
import {StreamChat} from "stream-chat";



dotenv.config({path: ".env"})

const OPENAI_AUTHORIZATION_KEY = process.env.OPENAI_AUTHORIZATION_KEY;
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;

const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

const app = express();
const port = 3000;
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

async function logic(request) {

    const {channel_id, channel_type, user } = request;

    if(user.id == 'bot'){
        return;
    }

    const channel= serverClient.channel(channel_type,channel_id);
    await channel.create();
   try {
    await channel.sendMessage({
        text: 'okey',
        user: {
            id: "bot",
            image: "https://openai.com/content/images/2022/05/openai-avatar.png",
            name: "Tsogoo's bot",
        },
    })
   console.log("success");
   return true
   } catch(e) {
    console.log(e);
    return false;
   }
}

app.post("/gpt-request", async (request, response, next) => {
    console.log(`requested: ${JSON.stringify(request.body)}`);

    const type=request.body["type"];
    if(type=="message.new")
    logic(request.body)

    response.json({
      status: true,
      text: "",
    });
    


});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  


 export function parseGPTResponse(formattedString) {
    const dataChunks = formattedString.split("data:");
    const responseObjectText = dataChunks[dataChunks.length - 2].trim();
    const responseObject = JSON.parse(responseObjectText);
    return responseObject.message.content.parts[0];
}



// async function main() {
//   const completion = await openai.chat.completions.create({
//     messages: [{ role: "system", content: "You are a helpful assistant." }],
//     model: "gpt-3.5-turbo",
//   });

//   console.log(completion.choices[0]);
// }

// main();