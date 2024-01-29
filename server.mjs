import * as dotenv from 'dotenv';
import express from "express";
import {StreamChat} from "stream-chat";
import {OpenAI} from "openai"

dotenv.config({path: ".env"})

//const OPENAI_AUTHORIZATION_KEY = process.env.OPENAI_AUTHORIZATION_KEY;
const STREAM_API_KEY = process.env.STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_API_SECRET;


const openai=new OpenAI({apiKey: process.env.OPEN_API_KEY});
const assistant=await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);


const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

const app = express();
const port = 3000;
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Welcome to my server!');
});

async function logic(data) {

    const {channel_id, channel_type, user } = data;

    if(user.id == 'chatbot'){
        return;
    }
    
    const message=data["message"]["text"];
    console.log(`message: ${message}, sent by ${user.id}`);

    const responseMsg=await assistant_api(message);

    const channel= serverClient.channel(channel_type,channel_id);
    await channel.create();
   try {
    await channel.sendMessage({
        text: responseMsg,
        user: {
            id: "chatbot",
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
  

async function assistant_api(message){
    
    //create thread
    const thread= await openai.beta.threads.create();


    //add a message to a thread
    const addingMessage=await openai.beta.threads.messages.create(
        thread.id,
        {
            role:"user",
            content:message
        }
    );

    // run the assistant 
    const run= await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistant.id,
        model: "gpt-4-turbo-preview",
        tools: [{"type": "code_interpreter"}, {"type": "retrieval"}]
      }
    );

    let response_status='';

    while(run.status!="completed"){
       const  keep_retrieving_run= await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
        );
        console.log(`run status: ${keep_retrieving_run.status}`);
        if(keep_retrieving_run.status=="completed")
        {
          response_status="completed";
          break;
        }
        else if(keep_retrieving_run.status=="cancelled")
        {
          response_status="cancelled";
          break;
        }
        else if( keep_retrieving_run.status=="failed"){
          response_status="failed";
          break;
        }
    }


   const messages=await openai.beta.threads.messages.list(thread.id);

    messages.body.data.forEach(element => {
        console.log(`message: ${element}`);
    });
    const res=messages.body.data[0].content[0]['text']['value'];
    console.log(`response: ${res} `);

 return res;
}

