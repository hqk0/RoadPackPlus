import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { ChestFormData } from "./extensions/forms.js";

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

world.afterEvents.itemUse.subscribe((ev) => {
  switch (ev.itemStack.typeId) {
    case "hakomc:cp_menu":
      homeMenu(ev.source);
      break;
    case "hakomc:nomal_cp_menu":
      nomalHomeMenu(ev.source);
      break;
    default:
      break;
  }
});

world.afterEvents.itemUseOn.subscribe((ev) => {
  const player = ev.source;
  const itemId = ev.itemStack.typeId;
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
      } else if (blockParts[0] === "hakomc:gray" && blockParts[1] === "line") {
        const currentValue =
          blockParts[4] === "full" ? 16 : parseInt(blockParts[4]);
        if (isNaN(currentValue)) return;

        const blockInt = calcBlock(currentValue, itemNum, itemSymbol);
        replaceBlock(blockParts, blockLocation, player, blockInt, 4);
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

function homeMenu(player) {
  new ChestFormData("9")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l灰色のコンクリートパウダー",
      ["", "§r1/16~16/16サイズまで", "§r§7クリックで一覧を表示"],
      "minecraft:gray_concrete_powder",
    )
    .button(
      1,
      "§l白色のコンクリートパウダー",
      ["", "§r1/16~16/16サイズ", "§r§7クリックで一覧を表示"],
      "minecraft:concrete_powder",
    )
    .button(
      2,
      "§lオレンジのコンクリートパウダー",
      ["", "§r1/16~16/16サイズ", "§r§7クリックで一覧を表示"],
      "minecraft:orange_concrete_powder",
    )
    .button(
      3,
      "§l太い縦・横ラインのコンクリートパウダー",
      ["", "§r1/16~16/16サイズ", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_thick_a",
    )
    .button(
      4,
      "§l細い縦・横ラインのコンクリートパウダー",
      ["", "§r1/16~16/16サイズ", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_thin_a",
    )
    .button(
      5,
      "§l斜めの縦・横ラインのコンクリートパウダー",
      ["", "§r1/16~16/16サイズ", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_a",
    )
    .button(
      6,
      "§lその他特殊ブロック",
      ["", "§r縁石や側溝など", "§r§7クリックで一覧を表示"],
      "textures/ui_items/sokkou",
    )
    .button(
      7,
      "§l調整ツール",
      ["", "§r段数・向きの変更", "§r§7クリックで一覧を表示"],
      "textures/ui_items/stick",
    )
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          grayMenu(player);
          break;
        case 1:
          whiteMenu(player);
          break;
        case 2:
          orangeMenu(player);
          break;
        case 3:
          lineThickMenu(player);
          break;
        case 4:
          lineThinMenu(player);
          break;
        case 5:
          lineSlantingMenu(player);
          break;
        case 6:
          roadBlocksMenu(player);
          break;
        case 7:
          toolsMenu(player);
          break;
        default:
          break;
      }
    });
}

function nomalHomeMenu(player) {
  const form = new ActionFormData()
    .title("道路向け追加ブロックメニュー")
    .button(
      "§l灰色のコンクリートパウダー\n§r§71/16〜16/16サイズ クリックで一覧を表示",
      "textures/ui_items/stick",
    )
    .button(
      "§l灰色のコンクリートパウダー\n§r§81/16〜16/16サイズ クリックで一覧を表示",
      "textures/ui_items/stick",
    );

  form.show(player).then((response) => {
    switch (response.selection) {
      case 0:
        break;
      default:
        break;
    }
  });
}

function grayMenu(player) {
  const menuItems = Array(16)
    .fill()
    .map((_, i) => ({
      name: "§a落下しない§f灰色のコンクリートパウダー",
      lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
      icon: "minecraft:gray_concrete_powder",
    }));

  // ハーフブロックとフルサイズの特別処理
  menuItems[7].lore[0] = "§eハーフブロック";
  menuItems[15].lore[0] = "§eフルサイズ";

  const form = new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    );

  // ボタンの追加
  menuItems.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return homeMenu(player);

    const command =
      selection === 17
        ? "/give @p hakomc:gray_cp_full"
        : `/give @p hakomc:gray_cp_${selection > 8 ? selection - 1 : selection}`;

    player.runCommand(command);
    grayMenu(player);
  });
}

function whiteMenu(player) {
  const menuItems = Array(16)
    .fill()
    .map((_, i) => ({
      name: "§a落下しない§f白色のコンクリートパウダー",
      lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
      icon: "minecraft:concrete_powder",
    }));

  // ハーフブロックとフルサイズの特別処理
  menuItems[7].lore[0] = "§eハーフブロック";
  menuItems[15].lore[0] = "§eフルサイズ";

  const form = new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    );

  // ボタンの追加
  menuItems.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return homeMenu(player);

    const command =
      selection === 17
        ? "/give @p hakomc:white_cp_full"
        : `/give @p hakomc:white_cp_${selection > 8 ? selection - 1 : selection}`;

    player.runCommand(command);
    whiteMenu(player);
  });
}

function orangeMenu(player) {
  const menuItems = Array(16)
    .fill()
    .map((_, i) => ({
      name: "§a落下しない§fオレンジのコンクリートパウダー",
      lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
      icon: "minecraft:orange_concrete_powder",
    }));

  // ハーフブロックとフルサイズの特別処理
  menuItems[7].lore[0] = "§eハーフブロック";
  menuItems[15].lore[0] = "§eフルサイズ";

  const form = new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    );

  // ボタンの追加
  menuItems.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return homeMenu(player);

    const command =
      selection === 17
        ? "/give @p hakomc:orange_cp_full"
        : `/give @p hakomc:orange_cp_${selection > 8 ? selection - 1 : selection}`;

    player.runCommand(command);
    orangeMenu(player);
  });
}

function lineThickMenu(player) {
  const createMenuItems = (isVertical) => {
    const baseText = `太い${isVertical ? "縦" : "横"}向きの白線が入った§a落下しない§f灰色のコンクリートパウダー`;
    const texture = `textures/blocks/concrete_powder_gray_white_line_thick_${isVertical ? "b" : "a"}`;

    return Array(16)
      .fill()
      .map((_, i) => ({
        name: baseText,
        lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
        icon: texture,
      }));
  };

  const horizontalItems = createMenuItems(false);
  const verticalItems = createMenuItems(true);

  // ハーフブロックとフルサイズの特別処理
  [horizontalItems, verticalItems].forEach((items) => {
    items[7].lore[0] = "§eハーフブロック";
    items[15].lore[0] = "§eフルサイズ";
  });

  const form = new ChestFormData("36")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    );

  // 横向きのボタンを追加
  horizontalItems.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  // 縦向きのボタンを追加
  verticalItems.forEach((item, i) => {
    const slot = i < 8 ? i + 19 : i + 20; // インデックス27をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return homeMenu(player);

    let command = "";
    if (selection <= 17) {
      // 横向き
      command =
        selection === 17
          ? "/give @p hakomc:gray_line_thick_a_full"
          : `/give @p hakomc:gray_line_thick_a_${selection > 8 ? selection - 1 : selection}`;
    } else {
      // 縦向き
      command =
        selection === 35
          ? "/give @p hakomc:gray_line_thick_b_full"
          : `/give @p hakomc:gray_line_thick_b_${selection >= 28 ? selection - 19 : selection - 18}`;
    }

    player.runCommand(command);
    lineThickMenu(player);
  });
}

function lineThinMenu(player) {
  const createMenuItems = (isVertical) => {
    const baseText = `細い${isVertical ? "縦" : "横"}向きの白線が入った§a落下しない§f灰色のコンクリートパウダー`;
    const texture = `textures/blocks/concrete_powder_gray_white_line_thin_${isVertical ? "b" : "a"}`;

    return Array(16)
      .fill()
      .map((_, i) => ({
        name: baseText,
        lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
        icon: texture,
      }));
  };

  const horizontalItems = createMenuItems(false);
  const verticalItems = createMenuItems(true);

  // ハーフブロックとフルサイズの特別処理
  [horizontalItems, verticalItems].forEach((items) => {
    items[7].lore[0] = "§eハーフブロック";
    items[15].lore[0] = "§eフルサイズ";
  });

  const form = new ChestFormData("36")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    );

  // 横向きのボタンを追加
  horizontalItems.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  // 縦向きのボタンを追加
  verticalItems.forEach((item, i) => {
    const slot = i < 8 ? i + 19 : i + 20; // インデックス27をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return homeMenu(player);

    let command = "";
    if (selection <= 17) {
      // 横向き
      command =
        selection === 17
          ? "/give @p hakomc:gray_line_thin_a_full"
          : `/give @p hakomc:gray_line_thin_a_${selection > 8 ? selection - 1 : selection}`;
    } else {
      // 縦向き
      command =
        selection === 35
          ? "/give @p hakomc:gray_line_thin_b_full"
          : `/give @p hakomc:gray_line_thin_b_${selection >= 28 ? selection - 19 : selection - 18}`;
    }

    player.runCommand(command);
    lineThinMenu(player);
  });
}

function lineSlantingMenu(player) {
  new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    )
    .button(
      1,
      "§l右下に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§eフルサイズ", "", "§r§7クリックでgive"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_a",
    )
    .button(
      2,
      "§l左上に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§eフルサイズ", "", "§r§7クリックでgive"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_b",
    )
    .button(
      3,
      "§l左下に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§eフルサイズ", "", "§r§7クリックでgive"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_c",
    )
    .button(
      4,
      "§l右上に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§eフルサイズ", "", "§r§7クリックでgive"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_d",
    )
    .button(
      10,
      "§l右下に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§e1/16~16/16サイズ", "", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_a",
    )
    .button(
      11,
      "§l左上に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§e1/16~16/16サイズ", "", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_b",
    )
    .button(
      12,
      "§l左下に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§e1/16~16/16サイズ", "", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_c",
    )
    .button(
      13,
      "§l右上に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー",
      ["§r§e1/16~16/16サイズ", "", "§r§7クリックで一覧を表示"],
      "textures/blocks/concrete_powder_gray_white_line_slanting_d",
    )
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          homeMenu(player);
          break;
        case 1:
          player.runCommand("/give @p hakomc:gray_line_slanting_a_full");
          lineSlantingMenu(player);
          break;
        case 2:
          player.runCommand("/give @p hakomc:gray_line_slanting_b_full");
          lineSlantingMenu(player);
          break;
        case 3:
          player.runCommand("/give @p hakomc:gray_line_slanting_c_full");
          lineSlantingMenu(player);
          break;
        case 4:
          player.runCommand("/give @p hakomc:gray_line_slanting_d_full");
          lineSlantingMenu(player);
          break;
        case 10:
          lineSlantingDetailsMenu(player, "a");
          break;
        case 11:
          lineSlantingDetailsMenu(player, "b");
          break;
        case 12:
          lineSlantingDetailsMenu(player, "c");
          break;
        case 13:
          lineSlantingDetailsMenu(player, "d");
          break;
        default:
          break;
      }
    });
}

function lineSlantingDetailsMenu(player, type) {
  const items = createMenuItems(type);

  // ハーフブロックとフルサイズの特別処理
  [items].forEach((items) => {
    items[7].lore[0] = "§eハーフブロック";
    items[15].lore[0] = "§eフルサイズ";
  });

  const form = new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックで一つ前に戻る"],
      "minecraft:barrier",
    );

  items.forEach((item, i) => {
    const slot = i < 8 ? i + 1 : i + 2; // インデックス9をスキップ
    form.button(slot, item.name, item.lore, item.icon);
  });

  form.show(player).then(({ canceled, selection }) => {
    if (canceled) return;
    if (selection === 0) return lineSlantingMenu(player);

    let command = "";

    command =
      selection === 17
        ? `/give @p hakomc:gray_line_slanting_${type}_full`
        : `/give @p hakomc:gray_line_slanting_${type}_${selection > 8 ? selection - 1 : selection}`;

    player.runCommand(command);
    lineSlantingDetailsMenu(player, type);
  });
}

function createMenuItems(type) {
  let typeText;
  switch (type) {
    case "a":
      typeText = "右下";
      break;
    case "b":
      typeText = "左上";
      break;
    case "c":
      typeText = "左下";
      break;
    case "d":
      typeText = "右上";
      break;
  }
  const baseText = `${typeText}に斜めの白線が入った§a落下しない§f灰色のコンクリートパウダー`;
  const texture = `textures/blocks/concrete_powder_gray_white_line_slanting_${type}`;

  return Array(16)
    .fill()
    .map((_, i) => ({
      name: baseText,
      lore: [`§e${i + 1}/16サイズ`, "", "§r§7クリックでgive"],
      icon: texture,
    }));
}

function roadBlocksMenu(player) {
  new ChestFormData("18")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    )
    .button(
      1,
      "§l側溝ブロック",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/sokkou",
    )
    .button(
      2,
      "§l縁石ブロック(左端)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/enseki_end_2",
    )
    .button(
      3,
      "§l縁石ブロック(中央)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/enseki_center",
    )
    .button(
      4,
      "§l縁石ブロック(右端)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/enseki_end_1",
    )
    .button(
      10,
      "§l縁石一体型横断防止柵(右端)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/saku_end_1",
    )
    .button(
      11,
      "§l縁石一体型横断防止柵(中央)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/saku_center",
    )
    .button(
      12,
      "§l縁石一体型横断防止柵(中央 柱付き)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/saku_pole",
    )
    .button(
      13,
      "§l縁石一体型横断防止柵(左端)",
      ["", "§rプレイヤーの向きに合わせて回転", "§r§7クリックでgive"],
      "textures/ui_items/saku_end_2",
    )
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          homeMenu(player);
          break;
        case 1:
          player.runCommand("/give @p hakomc:sokkou");
          roadBlocksMenu(player);
          break;
        case 2:
          player.runCommand("/give @p hakomc:enseki_end_2");
          roadBlocksMenu(player);
          break;
        case 3:
          player.runCommand("/give @p hakomc:enseki_center");
          roadBlocksMenu(player);
          break;
        case 4:
          player.runCommand("/give @p hakomc:enseki_end_1");
          roadBlocksMenu(player);
          break;
        case 10:
          player.runCommand("/give @p hakomc:saku_end_1");
          roadBlocksMenu(player);
          break;
        case 11:
          player.runCommand("/give @p hakomc:saku_center");
          roadBlocksMenu(player);
          break;
        case 12:
          player.runCommand("/give @p hakomc:saku_pole");
          roadBlocksMenu(player);
          break;
        case 13:
          player.runCommand("/give @p hakomc:saku_end_2");
          roadBlocksMenu(player);
          break;
        default:
          break;
      }
    });
}

function toolsMenu(player) {
  new ChestFormData("9")
    .title("§l道路向け追加ブロックメニュー")
    .button(
      0,
      "§l§c戻る",
      ["", "§r§7クリックでホームメニューに戻る"],
      "minecraft:barrier",
    )
    .button(
      1,
      "§l回転",
      ["", "§r右クリックで90度回転", "§r§7クリックでgive"],
      "textures/items/block_change_rotate",
    )
    .button(
      2,
      "§l1段変更",
      [
        "",
        "§r右クリックで1段増加・しゃがんで右クリックで1段減少",
        "§r§7クリックでgive",
      ],
      "textures/items/block_change_num_1",
    )
    .button(
      3,
      "§l2段変更",
      [
        "",
        "§r右クリックで2段増加・しゃがんで右クリックで2段減少",
        "§r§7クリックでgive",
      ],
      "textures/items/block_change_num_2",
    )
    .button(
      4,
      "§l4段変更",
      [
        "",
        "§r右クリックで4段増加・しゃがんで右クリックで4段減少",
        "§r§7クリックでgive",
      ],
      "textures/items/block_change_num_4",
    )
    .button(
      5,
      "§l8段変更",
      [
        "",
        "§r右クリックで8段増加・しゃがんで右クリックで8段減少",
        "§r§7クリックでgive",
      ],
      "textures/items/block_change_num_8",
    )
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      switch (response.selection) {
        case 0:
          homeMenu(player);
          break;
        case 1:
          player.runCommand("/give @p hakomc:block_change_rotate");
          toolsMenu(player);
          break;
        case 2:
          player.runCommand("/give @p hakomc:block_change_num_1");
          toolsMenu(player);
          break;
        case 3:
          player.runCommand("/give @p hakomc:block_change_num_2");
          toolsMenu(player);
          break;
        case 4:
          player.runCommand("/give @p hakomc:block_change_num_4");
          toolsMenu(player);
          break;
        case 5:
          player.runCommand("/give @p hakomc:block_change_num_8");
          toolsMenu(player);
          break;
        default:
          break;
      }
    });
}
