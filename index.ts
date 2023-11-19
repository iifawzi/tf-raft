import "module-alias/register";
import { FixedCluster } from "./clusters/fixed.cluster";

const cluster = new FixedCluster();

(async () => {
  cluster.start();
})();
