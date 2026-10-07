import streamDeck from "@elgato/streamdeck";

import { CameraView } from "./actions/camera-view";
import { FanToggle } from "./actions/fan-toggle";
import { PrintStatus } from "./actions/print-status";
import { NozzleTemp } from "./actions/nozzle-temp";
import { BedTemp } from "./actions/bed-temp";

streamDeck.logger.setLevel("info");

streamDeck.actions.registerAction(new PrintStatus());
streamDeck.actions.registerAction(new NozzleTemp());
streamDeck.actions.registerAction(new BedTemp());
streamDeck.actions.registerAction(new FanToggle());
streamDeck.actions.registerAction(new CameraView());

streamDeck.connect();
