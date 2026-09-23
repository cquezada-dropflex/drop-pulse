import type * as React from 'react';

export type IconName = 'sparkle' | 'eye' | 'check' | 'x' | 'loader' | 'check-circle' | 'alert' | 'chevron-right' | 'chevron-left' | 'plus' | 'inbox' | 'box' | 'megaphone' | 'chat' | 'lock' | 'image' | 'tag' | 'text' | 'store' | 'send' | 'arrow-up' | 'arrow-down' | 'pause' | 'power' | 'more' | 'undo' | 'edit' | 'search' | 'clock' | 'minus' | 'truck' | 'trend' | 'grip' | 'star' | 'settings';
export interface IconProps { name: IconName; size?: 'sm'; label?: string; strokeWidth?: number; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName; iconEnd?: IconName; loading?: boolean; block?: boolean;
  /** Atajo de teclado visible (escritorio): 'A', 'D', 'E'. */
  kbd?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface IconButtonProps { icon: IconName; label: string; variant?: 'primary'; onClick?: () => void; className?: string }
export declare function IconButton(props: IconButtonProps): React.ReactElement;

export type ContentStatus = 'generado' | 'revision' | 'aprobado' | 'rechazado' | 'publicando' | 'publicado' | 'error';
export interface StatusBadgeProps { status: ContentStatus; size?: 'sm'; label?: string }
export declare function StatusBadge(props: StatusBadgeProps): React.ReactElement;

export type MeterStage = 'done' | 'current' | 'review' | 'stuck' | 'error' | 'locked' | 'optional';
export interface StageMeterProps { stages: MeterStage[] }
export declare function StageMeter(props: StageMeterProps): React.ReactElement;

export interface ProductRowProps { name: string; image?: string; imageIndex?: number; stages?: MeterStage[]; reason?: string; tone?: 'warning' | 'danger' | 'success' | 'primary' | 'muted'; end?: React.ReactNode; onClick?: () => void }
export declare function ProductRow(props: ProductRowProps): React.ReactElement;

export interface AttentionItemProps { kind?: 'review' | 'error' | 'ads' | 'ads-up' | 'stuck'; title: string; product?: string; detail?: string; actions?: React.ReactNode }
export declare function AttentionItem(props: AttentionItemProps): React.ReactElement;

export interface Stage { title: string; state: 'done' | 'current' | 'review' | 'available' | 'locked' | 'error'; desc?: string; optional?: boolean; end?: React.ReactNode }
export interface StageListProps { stages: Stage[]; label?: string }
export declare function StageList(props: StageListProps): React.ReactElement;

export interface ReviewCardProps { field: string; original?: React.ReactNode; proposal?: React.ReactNode; proposalText?: string; index?: number; total?: number; state?: 'pending' | 'editing' | 'accepted' | 'discarded'; keys?: boolean; hideActions?: boolean }
export declare function ReviewCard(props: ReviewCardProps): React.ReactElement;

export interface ImageTileProps { src?: string; alt?: string; state?: 'idle' | 'selected' | 'discarded' | 'generating' | 'error'; order?: number; imageIndex?: number; shape?: number }
export declare function ImageTile(props: ImageTileProps): React.ReactElement;

export interface SegmentedOption { value: string; label?: string; count?: number }
export interface SegmentedControlProps { options: (SegmentedOption | string)[]; value: string; onChange?: (v: string) => void; label: string; block?: boolean }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

export interface FieldProps { label: string; value?: string; id?: string; prefix?: string; suffix?: string; hint?: string; error?: string; disabled?: boolean; ai?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }
export declare function Field(props: FieldProps): React.ReactElement;

export interface PricePart { label: string; value: number; color?: string }
export interface PriceBreakdownProps { price: number; parts: PricePart[]; note?: string }
export declare function PriceBreakdown(props: PriceBreakdownProps): React.ReactElement;

export interface OfferPreviewProps { title: string; price: number; compareAt?: number; image?: string; imageIndex?: number; store?: string; cta?: string }
export declare function OfferPreview(props: OfferPreviewProps): React.ReactElement;

export interface MetricProps { label: string; value: string; target?: string; trend?: 'good' | 'bad' | 'warn' }
export declare function Metric(props: MetricProps): React.ReactElement;

export type Verdict = 'subir' | 'seguir' | 'vigilar' | 'apagar' | 'aprendiendo';
export interface CampaignCardProps { name: string; verdict?: Verdict; reason: string; verdictTitle?: string; metrics?: MetricProps[]; nextBudget?: string; paused?: boolean; meta?: string; imageIndex?: number; actions?: React.ReactNode[] | null }
export declare function CampaignCard(props: CampaignCardProps): React.ReactElement;

export interface NavigationProps { variant?: 'bar' | 'rail'; active: 'hoy' | 'productos' | 'campanas'; badges?: Partial<Record<'hoy' | 'productos' | 'campanas', number>>; items?: { id: string; label: string; icon: IconName }[] }
export declare function Navigation(props: NavigationProps): React.ReactElement;

export interface TopBarProps { title: string; subtitle?: string; back?: string; actions?: React.ReactNode; large?: boolean }
export declare function TopBar(props: TopBarProps): React.ReactElement;

export interface ToastProps { message: string; action?: string }
export declare function Toast(props: ToastProps): React.ReactElement;

export interface AssistantMessage { from: 'user' | 'ai'; text: string | string[]; apply?: string }
export interface AssistantSheetProps { variant?: 'sheet' | 'panel'; context?: string; contextImage?: number; messages?: AssistantMessage[]; suggestions?: string[]; placeholder?: string; style?: React.CSSProperties }
export declare function AssistantSheet(props: AssistantSheetProps): React.ReactElement;

declare global {
  interface Window {
    DropFlex: {
      Button: typeof Button; IconButton: typeof IconButton; StatusBadge: typeof StatusBadge; StageMeter: typeof StageMeter;
      ProductRow: typeof ProductRow; AttentionItem: typeof AttentionItem; StageList: typeof StageList; ReviewCard: typeof ReviewCard;
      ImageTile: typeof ImageTile; SegmentedControl: typeof SegmentedControl; Field: typeof Field; PriceBreakdown: typeof PriceBreakdown;
      OfferPreview: typeof OfferPreview; Metric: typeof Metric; CampaignCard: typeof CampaignCard; Navigation: typeof Navigation;
      TopBar: typeof TopBar; Toast: typeof Toast; AssistantSheet: typeof AssistantSheet; Icon: typeof Icon;
    };
  }
}
