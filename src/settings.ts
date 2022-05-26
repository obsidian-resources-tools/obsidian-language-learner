import { App, Notice, PluginSettingTab, Setting, Modal, moment } from "obsidian"

import { WebDb } from "./db/web_db";
import LanguageLearner from "./plugin";


export interface MyPluginSettings {
    use_server: boolean;
    word_database: string;
    review_database: string;
    port: number;
    last_sync: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
    use_server: false,
    word_database: null,
    review_database: null,
    port: 8086,
    last_sync: "1970-01-01T00:00:00Z"
}

export class SettingTab extends PluginSettingTab {
    plugin: LanguageLearner;

    constructor(app: App, plugin: LanguageLearner) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();
        containerEl.createEl("h2", { text: "Settings for Language Learner" });

        new Setting(containerEl)
            .setName("Use Server")
            .setDesc("Use a seperated backend server")
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.use_server)
                .onChange(async (use_server) => {
                    this.plugin.settings.use_server = use_server
                    await this.plugin.saveSettings()
                })
            )

        new Setting(containerEl)
            .setName("Server Port")
            .setDesc(
                'An integer between 1024-65535. It should be same as "PORT" variable in .env file of server'
            )
            .setDisabled(!this.plugin.settings.use_server)
            .addText((text) =>
                text
                    .setValue(String(this.plugin.settings.port))
                    .onChange(async (port) => {
                        let p = Number(port);
                        if (!isNaN(p) && p >= 1023 && p <= 65535) {
                            this.plugin.settings.port = p;
                            (this.plugin.db as WebDb).port = p
                            await this.plugin.saveSettings();
                        } else {
                            new Notice("Wrong port format");
                        }
                    })
            );

        new Setting(containerEl)
            .setName("Word Database Path")
            .setDesc("Choose a md file as word database for auto-completion")
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.word_database)
                    .onChange(async (path) => {
                        this.plugin.settings.word_database = path;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Review Database Path")
            .setDesc("Choose a md file as review database for spaced-repetition")
            .addText((text) =>
                text
                    .setValue(this.plugin.settings.review_database)
                    .onChange(async (path) => {
                        this.plugin.settings.review_database = path;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Last review sync")
            .setDesc("Last time the review database was updated")
            .addMomentFormat(date =>
                date
                    .setValue(moment.utc(this.plugin.settings.last_sync).local().format())

            ).setDisabled(true)

        new Setting(containerEl)
            .setName("Destroy Database")
            .setDesc("Destroy all stuff and start over")
            .addButton(button => button
                .setButtonText("Destroy")
                .setWarning()
                .onClick(async (evt) => {
                    let modal = new WarningModal(this.app, async () => {
                        await this.plugin.db.destroyAll()
                        new Notice("啊啊啊")
                    })
                    modal.open()
                })
            )
    }
}

export class WarningModal extends Modal {
    onSubmit: () => Promise<void>;

    constructor(app: App, onSubmit: () => Promise<void>) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;

        contentEl.createEl("h2", { text: "Are you sure you want to destroy your database?" });

        new Setting(contentEl)
            .addButton((btn) => btn
                .setButtonText("Destroy")
                .setWarning()
                .setCta()
                .onClick(() => {
                    this.close()
                    this.onSubmit();
                })
            )
            .addButton((btn) => btn
                .setButtonText("No!!!")
                .setCta() // what is this?
                .onClick(() => {
                    this.close();
                }))
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}