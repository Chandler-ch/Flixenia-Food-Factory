import "dotenv/config";
import { InstallGlobalCommands } from "./utils.js";

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic bitch",
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};

const IMAGE_COMMAND = {
  name: "image",
  description: "sends picture",
  type: 1,
};

const ALL_COMMANDS = [TEST_COMMAND, IMAGE_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
