import { getIO } from "../socket";
import { Table } from "../models/Table";

export const broadcastStats = async () => {
  const total = await Table.countDocuments();
  const available = await Table.countDocuments({ status: "free" });
  getIO().emit("tableStatsUpdated", { total, available });
};
