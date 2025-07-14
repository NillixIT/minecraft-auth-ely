// utils/StatusManager.ts

import { MojangStatus, MojangStatusColor } from '../types/MojangTypes';

export class StatusManager {
  public static getDefaultStatuses(): MojangStatus[] {
    return [
      {
        service: 'mojang-multiplayer-session-service',
        status: MojangStatusColor.GREY,
        name: 'Multiplayer Session Service',
        essential: true
      },
      {
        service: 'minecraft-skins',
        status: MojangStatusColor.GREY,
        name: 'Minecraft Skins',
        essential: false
      },
      {
        service: 'mojang-s-public-api',
        status: MojangStatusColor.GREY,
        name: 'Public API',
        essential: false
      },
      {
        service: 'mojang-accounts-website',
        status: MojangStatusColor.GREY,
        name: 'Mojang Accounts Website',
        essential: false
      },
      {
        service: 'microsoft-o-auth-server',
        status: MojangStatusColor.GREY,
        name: 'Microsoft OAuth Server',
        essential: true
      },
      {
        service: 'xbox-live-auth-server',
        status: MojangStatusColor.GREY,
        name: 'Xbox Live Auth Server',
        essential: true
      },
      {
        service: 'xbox-live-gatekeeper',
        status: MojangStatusColor.GREY,
        name: 'Xbox Live Gatekeeper',
        essential: true
      },
      {
        service: 'microsoft-minecraft-api',
        status: MojangStatusColor.GREY,
        name: 'Minecraft API for Microsoft Accounts',
        essential: true
      },
      {
        service: 'microsoft-minecraft-profile',
        status: MojangStatusColor.GREY,
        name: 'Minecraft Profile for Microsoft Accounts',
        essential: false
      }
    ];
  }

  /**
   * Converts a Mojang status color to a hex value. Valid statuses
   * are 'green', 'yellow', 'red', and 'grey'. Grey is a custom status
   * to our project which represents an unknown status.
   */
  public static statusToHex(status: string): string {
    switch (status.toLowerCase() as MojangStatusColor) {
      case MojangStatusColor.GREEN:
        return '#a5c325';
      case MojangStatusColor.YELLOW:
        return '#eac918';
      case MojangStatusColor.RED:
        return '#c32625';
      case MojangStatusColor.GREY:
      default:
        return '#848484';
    }
  }
}
