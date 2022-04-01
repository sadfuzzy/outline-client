/*
  Copyright 2021 The Outline Authors
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {computed, customElement, property} from "@polymer/decorators";
import {html, PolymerElement} from "@polymer/polymer";

import Sortable from "sortablejs";

import {ServerCard} from "./server_card";
import {ServerConnectionState} from "./server_card/server_connection_viz";

export interface ServerCardModel {
  disabled: boolean;
  errorMessageId: string;
  isOutlineServer: boolean;
  address: string;
  id: string;
  name: string;
  state: ServerConnectionState;
}

@customElement("server-list")
export class ServerList extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          margin: 0 auto;
          width: 100%;
          height: 100%;
        }

        server-card {
          margin: 8px auto;
          max-width: 400px; /* better card spacing on pixel and iphone */
          padding: 0 8px; /* necessary for smaller displays */
          transition: transform 150ms ease;
        }

        server-card.sortable-ghost {
          opacity: 0.3;
        }

        server-card.sortable-chosen {
          transform: scale(1.04);
        }

        @media (min-width: 600px) {
          server-card {
            margin: 24px auto;
            max-width: 550px;
          }
        }
      </style>

      <div id="sortableContainer">
        <template is="dom-repeat" items="[[servers]]">
          <server-card
            disabled="[[item.errorMessageId]]"
            error-message="[[localize(item.errorMessageId)]]"
            expanded="[[hasSingleServer]]"
            localize="[[localize]]"
            root-path="[[rootPath]]"
            server-address="[[item.address]]"
            server-id="[[item.id]]"
            localized-server-name="[[localizeServerName(item.name, item.isOutlineServer)]]"
            localized-server-rename="[[localize('server-rename')]"
            localized-server-forget="[[localize('server-forget')]"
            localized-status-message="[[localizeStatusMessage(item.state)]]"
            localized-connect-button-label="[[localizeConnectButtonLabel(item.state)]]"
            connect-button-disabled="[[computeConnectButtonDisabled(item.errorMessageId, item.state)]]"
            expanded-class-name="[[computeExpandedClassName(hasSingleServer)]]"
            is-outline-server="[[item.isOutlineServer]]"
            state="[[item.state]]"
          ></server-card>
        </template>
      </div>
    `;
  }

  // Need to declare localize function passed in from parent, or else
  // localize() calls within the template won't be updated.

  // @polymer/decorators doesn't support Function constructors...
  @property({type: Object}) localize: (messageId: string) => string;
  @property({type: String}) rootPath: string;
  @property({type: Array}) servers: ServerCardModel[] = [];

  // TODO: handling magic numbers?
  @property({type: Number}) sortableDelayMS = 350;
  @property({type: Number}) sortableAnimationDurationMS = 150;

  @computed("servers")
  get hasSingleServer() {
    return this.servers.length === 1;
  }

  @computed("servers", "sortableDelayMS", "sortableAnimationDurationMS")
  get sortable(): Sortable {
    if (!this.servers.length || this.hasSingleServer) return null;

    return Sortable.create(this.$.sortableContainer as HTMLElement, {
      delay: this.sortableDelayMS,
      delayOnTouchOnly: true,
      animation: this.sortableAnimationDurationMS,

      // TODO: update the config on change
      onEnd: event => console.debug("onEnd", event),
    });
  }

  localizeServerName(serverName: string, isOutlineServer: boolean): string {
    if (serverName.length) {
      return serverName;
    }

    return this.localize(isOutlineServer ? "server-default-name-outline" : "server-default-name");
  }

  localizeStatusMessage(state: ServerConnectionState): string {
    if (!this.localize) return "";

    switch (state) {
      case ServerConnectionState.CONNECTING:
        return this.localize("connecting-server-state");
      case ServerConnectionState.CONNECTED:
        return this.localize("connected-server-state");
      case ServerConnectionState.RECONNECTING:
        return this.localize("reconnecting-server-state");
      case ServerConnectionState.DISCONNECTING:
        return this.localize("disconnecting-server-state");
      case ServerConnectionState.DISCONNECTED:
      default:
        return this.localize("disconnected-server-state");
    }
  }

  localizeConnectButtonLabel(state: ServerConnectionState): string {
    if (!this.localize) return "";

    switch (state) {
      case ServerConnectionState.CONNECTING:
      case ServerConnectionState.CONNECTED:
      case ServerConnectionState.RECONNECTING:
        return this.localize("disconnect-button-label");
      case ServerConnectionState.DISCONNECTING:
      case ServerConnectionState.DISCONNECTED:
      default:
        return this.localize("connect-button-label");
    }
  }

  computeConnectButtonDisabled(disabled: boolean, state: ServerConnectionState): boolean {
    return disabled || state === ServerConnectionState.CONNECTING || state === ServerConnectionState.DISCONNECTING;
  }

  computeExpandedClassName(expanded: boolean): string {
    return expanded ? "expanded" : "";
  }
}
