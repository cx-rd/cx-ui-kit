import { NgStyle } from "@angular/common";
import { Component, computed, input, output } from "@angular/core";
import {
  ToastAction,
  ToastInstance,
  ToastStyleOverrides,
  ToastVariant,
} from "../../core/models";

interface ToastTheme {
  accentColor: string;
  accentSoftColor: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  titleColor: string;
  messageColor: string;
  background: string;
  backdropFilter: string;
  width: string;
  maxWidth: string;
  minHeight: string;
  borderRadius: string;
  boxShadow: string;
}

@Component({
  selector: "lib-toast",
  standalone: true,
  imports: [NgStyle],
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.component.scss",
})
export class ToastComponent {
  readonly toast = input.required<ToastInstance>();

  readonly dismiss = output<string>();
  readonly actionClick = output<{ id: string; action: ToastAction }>();
  readonly hoverChange = output<{ id: string; hovering: boolean }>();

  // 將主題 token 攤平成 CSS 變數，樣式客製時只要改資料不用切換額外 class。
  readonly hostStyles = computed<Record<string, string>>(() => {
    const toast = this.toast();
    const theme = this.resolveTheme(toast.variant ?? "info", toast.styles);

    return {
      "--tp-toast-accent": theme.accentColor,
      "--tp-toast-accent-soft": theme.accentSoftColor,
      "--tp-toast-border": theme.borderColor,
      "--tp-toast-icon": theme.iconColor,
      "--tp-toast-text": theme.textColor,
      "--tp-toast-title": theme.titleColor,
      "--tp-toast-message": theme.messageColor,
      "--tp-toast-background": theme.background,
      "--tp-toast-backdrop-filter": theme.backdropFilter,
      "--tp-toast-width": theme.width,
      "--tp-toast-max-width": theme.maxWidth,
      "--tp-toast-min-height": theme.minHeight,
      "--tp-toast-radius": theme.borderRadius,
      "--tp-toast-shadow": theme.boxShadow,
    };
  });

  // 未額外指定 icon 時，依變體使用預設圖示。
  readonly iconSvg = computed(() => {
    const toast = this.toast();
    return toast.icon ?? DEFAULT_ICON_MAP[toast.variant ?? "info"];
  });

  readonly toastClassName = computed(() => this.toast().className ?? "");

  onDismiss(): void {
    this.dismiss.emit(this.toast().id);
  }

  onAction(action: ToastAction): void {
    this.actionClick.emit({ id: this.toast().id, action });
  }

  onHover(hovering: boolean): void {
    this.hoverChange.emit({ id: this.toast().id, hovering });
  }

  // 以變體預設為底，再疊上單筆 toast 的樣式覆寫。
  private resolveTheme(
    variant: ToastVariant,
    overrides?: ToastStyleOverrides,
  ): ToastTheme {
    return { ...DEFAULT_THEME_MAP[variant], ...overrides };
  }
}

const DEFAULT_THEME: ToastTheme = {
  accentColor: "#0077aa",
  accentSoftColor: "rgba(56, 189, 248, 0.28)",
  borderColor: "rgb(0, 119, 255)",
  iconColor: "#38bdf8",
  textColor: "#ffffff",
  titleColor: "#ffffff",
  messageColor: "rgb(255, 255, 255)",
  background: "rgba(135, 201, 255, 0.8)",
  backdropFilter: "blur(26px) saturate(150%) brightness(1.03)",
  width: "min(100%, 300px)",
  maxWidth: "300px",
  minHeight: "40px",
  borderRadius: "10px",
  boxShadow:
    "0 16px 36px rgba(15, 23, 42, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.26)",
};

const DEFAULT_THEME_MAP: Record<ToastVariant, ToastTheme> = {
  success: {
    ...DEFAULT_THEME,
    accentColor: "#00a05d",
    accentSoftColor: "rgba(74, 222, 128, 0.3)",
    borderColor: "rgba(74, 222, 128, 1)",
    iconColor: "#4ade80",
    background: "rgba(129, 221, 164, 0.8)",
  },
  error: {
    ...DEFAULT_THEME,
    accentColor: "#b90000",
    accentSoftColor: "rgba(248, 113, 113, 0.3)",
    borderColor: "rgba(248, 113, 113, 1)",
    iconColor: "#f87171",
    background: "rgba(230, 114, 133, 0.8)",
  },
  info: DEFAULT_THEME,
  warning: {
    ...DEFAULT_THEME,
    accentColor: "#ad6e00",
    accentSoftColor: "rgba(245, 158, 11, 0.3)",
    borderColor: "rgba(245, 158, 11, 1)",
    iconColor: "#f59e0b",
    background: "rgba(232, 217, 99, 0.8)",
  },
  update: {
    ...DEFAULT_THEME,
    accentColor: "#2a00a9",
    accentSoftColor: "rgba(167, 139, 250, 0.3)",
    borderColor: "rgba(167, 139, 250, 1)",
    iconColor: "#a78bfa",
    background: "rgba(176, 151, 237, 0.8)",
  },
  loading: {
    ...DEFAULT_THEME,
    accentColor: "#00baa1",
    accentSoftColor: "rgba(45, 212, 191, 0.3)",
    borderColor: "rgba(45, 212, 191, 1)",
    iconColor: "#2dd4bf",
    background: "rgba(143, 228, 216, 0.8)",
  },
  neutral: {
    ...DEFAULT_THEME,
    accentColor: "#98a0a9",
    accentSoftColor: "rgba(203, 213, 225, 0.28)",
    borderColor: "rgba(203, 213, 225, 1)",
    iconColor: "#e2e8f0",
    background: "rgba(235, 240, 244, 0.34)",
  },
};

const DEFAULT_ICON_MAP: Record<ToastVariant, string> = {
  success:
    "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m-1.1 13.8-3.5-3.5 1.4-1.4 2.1 2.1 4.6-4.6 1.4 1.4Z",
  error:
    "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m3.7 12.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4L10.6 12 8.3 9.7l1.4-1.4L12 10.6l2.3-2.3 1.4 1.4L13.4 12Z",
  info: "M11 10h2v6h-2Zm0-4h2v2h-2ZM12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2",
  warning: "M1 21h22L12 2Zm12-3h-2v-2h2Zm0-4h-2v-4h2Z",
  update:
    "M21 12a9 9 0 0 1-15.4 6.4L4 20V14h6l-2.5 2.5A6 6 0 1 0 6 12H4a8 8 0 1 1 17 0Z",
  loading: "M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6Z",
  neutral: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2m1 15h-2v-2h2Zm0-4h-2V7h2Z",
};
