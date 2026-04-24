declare module "@xivapi/nodestone" {
  class NodestoneParser {
    parse(req: unknown, columnsPrefix?: string): Promise<unknown>
  }
  export class CharacterSearch extends NodestoneParser {}
  export class Character extends NodestoneParser {}
  export class FCMembers extends NodestoneParser {}
  export class FreeCompany extends NodestoneParser {}
}
