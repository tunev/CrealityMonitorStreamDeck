import streamDeck from "@elgato/streamdeck";

import { CameraView } from "./actions/camera-view";
import { FanToggle } from "./actions/fan-toggle";
import { PrintStatus } from "./actions/print-status";
import { PrintTemps } from "./actions/print-temps";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PrintStatus());
streamDeck.actions.registerAction(new PrintTemps());
streamDeck.actions.registerAction(new FanToggle());
streamDeck.actions.registerAction(new CameraView());

streamDeck.connect();
