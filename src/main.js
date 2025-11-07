import { world, system } from "@minecraft/server";

const OnUseOnItemComponent = {
  onUseOn(ev) {
    ev.source; // The entity that used the item on the block.
    ev.usedOnBlockPermutation; // The block permutation that the item was used on.
  },
};

/** @type {import("@minecraft/server").BlockCustomComponent} */
const BlockRotationComponent = {
  beforeOnPlayerPlace(ev) {
    const { player } = ev;
    if (!player) return; // Exit if the player is undefined

    // Get the rotation using the function from earlier
    const playerYRotation = player.getRotation().y;
    const rotation = getPreciseRotation(playerYRotation);

    ev.permutationToPlace = ev.permutationToPlace.withState(
      "hakomc:rotation",
      rotation,
    );
  },
};

/** @param {number} playerYRotation */
function getPreciseRotation(playerYRotation) {
  // Transform player's head Y rotation to a positive 0-360 value
  const angle = (playerYRotation + 360) % 360;

  if (angle >= 0 && angle < 90) {
    return 0; // North-East
  } else if (angle >= 90 && angle < 180) {
    return 1; // South-East
  } else if (angle >= 180 && angle < 270) {
    return 2; // South-West
  } else {
    // angle >= 270 && angle < 360
    return 3; // North-West
  }
}

system.beforeEvents.startup.subscribe(
  ({ itemComponentRegistry, blockComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
      "hakomc:onuseon",
      OnUseOnItemComponent,
    );

    blockComponentRegistry.registerCustomComponent(
      "hakomc:rotation",
      BlockRotationComponent,
    );
  },
);

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
