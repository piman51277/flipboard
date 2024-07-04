import { Automata } from "./automata";
import { FlipBoard } from "./flipboard";
import { ready } from "./ready";

ready(() => {
  //get the flip-container
  const flipContainer = document.getElementById(
    "flip-container"
  ) as HTMLDivElement;

  const board = new FlipBoard(flipContainer);
  //automata replicator B1357/S1357 moore
  const automat = new Automata(
    [0, 3, 0, 3, 0, 3, 0, 3, 0],
    "moore",
    ...board.dimensions,
    false
  );

  const update = async (): Promise<void> => {
    const dim = board.dimensions;

    console.log(board.dimensions[0] * board.dimensions[1]);
    automat.resize(...dim);
    await board.setMatrixRipple(automat.board, true);
    automat.update();

    setTimeout(() => requestAnimationFrame(update), 1000);
  };
  update();
});
