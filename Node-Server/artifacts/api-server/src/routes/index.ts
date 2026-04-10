import { Router, type IRouter } from "express";
import healthRouter from "./health";
import fornecedoresRouter from "./fornecedores";
import produtosRouter from "./produtos";

const router: IRouter = Router();

router.use(healthRouter);
router.use(fornecedoresRouter);
router.use(produtosRouter);

export default router;
