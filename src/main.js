import { world } from "@minecraft/server";
import { ChestFormData } from "./extensions/forms.js";

world.afterEvents.itemUse.subscribe((ev) => {
  switch (ev.itemStack.typeId) {
    case "minecraft:stick":
      primaryMenu(ev.source);
      break;
  }
});

function primaryMenu(player) {
  new ChestFormData("9")
    .title("§l§aMain Menu")
    .button(
      1,
      "§l§3Test Item 1",
      ["", "§r§7A testing item", "Click any item!"],
      "minecraft:filled_end_portal_frame",
    )
    .button(
      4,
      "§l§bTest Item 2",
      ["", "§r§7Another item", "Click any item!"],
      "minecraft:gold_ore",
      64,
      true,
    )
    .button(
      7,
      "§l§dTest Item 3",
      ["", "§r§7A third item", "Click any item!"],
      "textures/items/diamond",
      5,
    )
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      world.sendMessage(`${player.name} has chosen item ${response.selection}`);
      secondarymenu(player);
    });
}
