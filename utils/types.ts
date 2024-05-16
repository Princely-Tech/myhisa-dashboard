import { ButtonProps } from "antd";
import { OverrideToken } from "antd/es/theme/interface";
import { MappingAlgorithm } from "antd/lib/theme";
import { AliasToken } from "antd/lib/theme/internal";
type ComponentsConfig = {
  [key in keyof OverrideToken]?: OverrideToken[key] & {
    algorithm?: boolean | MappingAlgorithm | MappingAlgorithm[];
  };
};
type TransactionItem = {
  transaction_id: string;
  amount: number;
  network: string;
  msisdn: string;
  type: string;
  external_ref: string;
  status: string;
  created_at: string;
};
interface RippleProps {
  duration: number;
  color: string;
}
interface CustomButtonProps extends ButtonProps {
  rippleProps?: RippleProps | null;
  tokenConfig?: Partial<AliasToken>;
  componentConfig?: ComponentsConfig;
}
export type { TransactionItem, CustomButtonProps ,RippleProps};
