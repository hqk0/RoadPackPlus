import { world } from "@minecraft/server";

const OnUseOnItemComponent = {
  onUseOn(ev) {
    ev.source; // The entity that used the item on the block.
    ev.usedOnBlockPermutation; // The block permutation that the item was used on.
  },
};

/** @type {import("@minecraft/server").BlockCustomComponent} */
const BlockLineRotationComponent = {
  beforeOnPlayerPlace(ev) {
    const { player } = ev;
    if (!player) return; // Exit if the player is undefined

    // Get the rotation using the function from earlier
    const playerYRotation = player.getRotation().y;
    const rotation = getPreciseRotation(playerYRotation);
    const location = ev.block.location;

    ev.cancel = true;
    switch (rotation) {
      case 0:
      case 4:
        // Place the block with a rotation of 0 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_thin_a_full`,
        );
        break;
      case 1:
        // Place the block with a rotation of 135 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_slanting_b_full`,
        );
        break;
      case 2:
      case 6:
        // Place the block with a rotation of 90 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_thin_b_full`,
        );
        break;
      case 3:
        // Place the block with a rotation of 135 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_slanting_d_full`,
        );
        break;
      case 5:
        // Place the block with a rotation of 45 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_slanting_a_full`,
        );
        break;
      case 7:
        // Place the block with a rotation of 135 degrees
        player.runCommand(
          `/setblock ${location.x} ${location.y} ${location.z} hakomc:gray_line_slanting_c_full`,
        );
        break;
    }
  },
};

/** @param {number} playerYRotation */
function getPreciseRotation(playerYRotation) {
  // Transform player's head Y rotation to a positive
  if (playerYRotation < 0) playerYRotation += 360;
  // How many 8ths of 360 is the head rotation? - rounded
  const rotation = Math.round(playerYRotation / 45);

  // 0 and 8 represent duplicate rotations (0 degrees and 360 degrees), so 0 is returned if the value of `rotation` is 16
  return rotation !== 8 ? rotation : 0;
}

world.beforeEvents.worldInitialize.subscribe(
  ({ itemComponentRegistry, blockComponentRegistry }) => {
    itemComponentRegistry.registerCustomComponent(
      "hakomc:onuseon",
      OnUseOnItemComponent,
    );

    blockComponentRegistry.registerCustomComponent(
      "hakomc:line_rotation",
      BlockLineRotationComponent,
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
