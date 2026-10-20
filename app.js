import "dotenv/config";
import express from "express";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from "discord-interactions";
import { getRandomEmoji } from "./utils.js";
import { AttachmentBuilder, Client, GatewayIntentBits } from "discord.js";

const app = express();
const PORT = process.env.PORT || 3000;

const imgSrcStart = "./assets/essen/img_";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.login(process.env.DISCORD_TOKEN);

if (process.env.CHANNEL_ID) {
  client.on("ready", (client) => {
    imageSender(client.channels.cache.get(process.env.CHANNEL_ID));
    setInterval(
      async () =>
        imageSender(client.channels.cache.get(process.env.CHANNEL_ID)),
      3 * 60 * 60 * 1000,
    );
  });
}
/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post(
  "/interactions",
  verifyKeyMiddleware(process.env.PUBLIC_KEY),
  async function (req, res) {
    const { type, data, channel_id } = req.body;

    /**
     * Handle verification requests
     */
    if (type === InteractionType.PING) {
      return res.send({ type: InteractionResponseType.PONG });
    }

    /**
     * Handle slash command requests
     * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
     */
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name: commandName } = data;

      if (commandName === "test") {
        return textSender(res, `hello world ${getRandomEmoji()}`);
      }

      if (commandName === "image") {
        const channel = await client.channels.fetch(channel_id);

        imageSender(channel);
        setInterval(async () => imageSender(channel), 3 * 60 * 60 * 1000);
        return textSender(res, "Flixenia's Food Factory started to work!");
      }

      console.error(`unknown command: ${commandName}`);
      return res.status(400).json({ error: "unknown command" });
    }

    console.error("unknown interaction type", type);
    return res.status(400).json({ error: "unknown interaction type" });
  },
);

async function textSender(res, text) {
  res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: InteractionResponseFlags.IS_COMPONENTS_V2,
      components: [
        {
          type: MessageComponentTypes.TEXT_DISPLAY,
          content: text,
        },
      ],
    },
  });
}

async function imageSender(preStuff) {
  const imgNum = Math.floor(Math.random() * 238);
  const attachment = new AttachmentBuilder(imgSrcStart + imgNum + ".jpeg");
  await preStuff.send({
    flags: InteractionResponseFlags.IS_COMPONENTS_V2,
    files: [attachment],
    components: [
      {
        type: MessageComponentTypes.MEDIA_GALLERY,
        items: [
          {
            media: {
              url: `attachment://img_${imgNum}.jpeg`,
            },
          },
        ],
      },
    ],
  });
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
