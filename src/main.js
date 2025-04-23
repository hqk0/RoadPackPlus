import { world } from "@minecraft/server";

const onUseOnItemComponent = {
  onUseOn(event) {
    event.source; // The entity that used the item on the block.
    event.usedOnBlockPermutation; // The block permutation that the item was used on.
  },
};

world.beforeEvents.worldInitialize.subscribe(({ itemComponentRegistry }) => {
  itemComponentRegistry.registerCustomComponent(
    "hakomc:onuseon",
    onUseOnItemComponent,
  );
});

world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
  const player = ev.player;
  const itemId = ev.beforeItemStack.typeId;
  const itemParts = itemId.split("_");
  const blockId = ev.block.typeId;
  const blockParts = blockId.split("_");
  const blockLocation = ev.block.location;

  if (!itemId.startsWith("hakomc:block_change_")) return;

  let itemSymbol;
  if (player.isSneaking) {
    itemSymbol = "-";
  } else {
    itemSymbol = "+";
  }
  switch (itemParts[2]) {
    case "num":
      const itemNum = parseInt(itemParts[3]);
      if (isNaN(itemNum)) return;

      if (blockParts[1] === "cp") {
        const currentValue =
          blockParts[2] === "full" ? 16 : parseInt(blockParts[2]);
        if (isNaN(currentValue)) return;

        const blockInt = calcBlock(currentValue, itemNum, itemSymbol);

        replaceBlock(blockParts, blockLocation, player, blockInt, 2);
        player.onScreenDisplay.setActionBar(`${blockInt}`);
      } else if (blockParts[0] === "hakomc:gray" && blockParts[1] === "line") {
        const currentValue =
          blockParts[4] === "full" ? 16 : parseInt(blockParts[4]);
        if (isNaN(currentValue)) return;

        const blockInt = calcBlock(currentValue, itemNum, itemSymbol);
        replaceBlock(blockParts, blockLocation, player, blockInt, 4);
        player.onScreenDisplay.setActionBar(`${blockInt}`);
      }
      break;
    case "rotate":
      if (blockParts[0] === "hakomc:gray" && blockParts[2] === "slanting") {
        let currentType = blockParts[3];
        switch (currentType) {
          case "a":
            currentType = itemSymbol === "+" ? "c" : "d";
            break;
          case "b":
            currentType = itemSymbol === "+" ? "d" : "c";
            break;
          case "c":
            currentType = itemSymbol === "+" ? "b" : "a";
            break;
          case "d":
            currentType = itemSymbol === "+" ? "a" : "b";
            break;
        }
        replaceBlock(blockParts, blockLocation, player, currentType, 3);
      } else if (
        blockParts[0] === "hakomc:gray" &&
        (blockParts[2] === "thin" || blockParts[2] === "thick")
      ) {
        let currentType = blockParts[3];
        switch (currentType) {
          case "a":
            currentType = "b";
            break;
          case "b":
            currentType = "a";
            break;
        }
        replaceBlock(blockParts, blockLocation, player, currentType, 3);
      }
      break;
    default:
      break;
  }
});

function replaceBlock(blockParts, blockLocation, player, blockInt, index) {
  blockParts[index] = blockInt === 16 ? "full" : blockInt.toString();
  const blockId = blockParts.join("_");
  player.runCommand(
    `/setblock ${blockLocation.x} ${blockLocation.y} ${blockLocation.z} ${blockId}`,
  );
}

function calcBlock(a, b, operator) {
  let result = operator === "+" ? a + b : a - b;
  if (result === 0) return 16;
  return operator === "+"
    ? result >= 17
      ? result - 16
      : result
    : result < 0
      ? result + 16
      : result;
}
