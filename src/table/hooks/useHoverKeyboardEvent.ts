import {
  toRefs, Ref, ref, computed,
} from '@vue/composition-api';
import get from 'lodash/get';
import { BaseTableProps } from '../interface';
import { on, off } from '../../utils/dom';
import {
  ARROW_DOWN_REG, ARROW_UP_REG, SPACE_REG, ARROW_LEFT_REG, ARROW_RIGHT_REG,
} from '../../_common/js/common';
import { RowEventContext, TableRowData } from '../type';

/**
 * 需要进行表格行操作时，则需要键盘操作的悬浮效果来表达当前的哪一行
 * 如：高亮多行、行选中、行展开等功能
 */
export function useHoverKeyboardEvent(props: BaseTableProps, tableRef: Ref<HTMLDivElement>) {
  const {
    hover, data, activeRowType, keyboardRowHover,
  } = toRefs(props);
  const hoverRow = ref<string | number>();
  const currentHoverRowIndex = ref(-1);
  const tableRefTabIndex = ref(0);

  // 单行高亮场景，不需要键盘悬浮效果
  const needKeyboardRowHover = computed(() => {
    if (activeRowType.value === 'single') return false;
    if (activeRowType.value === 'multiple') return true;
    return hover.value || keyboardRowHover.value;
  });

  const onHoverRow = (ctx: RowEventContext<TableRowData>, extra?: { action?: 'hover' }) => {
    const rowValue = get(ctx.row, props.rowKey);
    if (hoverRow.value === rowValue && extra?.action !== 'hover') {
      hoverRow.value = undefined;
    } else {
      hoverRow.value = rowValue;
    }
    currentHoverRowIndex.value = ctx.index;
  };

  const clearHoverRow = () => {
    hoverRow.value = undefined;
    currentHoverRowIndex.value = -1;
  };

  const keyboardDownListener = (e: KeyboardEvent) => {
    if (!needKeyboardRowHover.value) return;
    const code = e.key?.trim() || e.code;
    if (ARROW_DOWN_REG.test(code)) {
      e.preventDefault();
      const index = Math.min(data.value.length - 1, currentHoverRowIndex.value + 1);
      onHoverRow({ row: data.value[index], index, e }, { action: 'hover' });
    } else if (ARROW_UP_REG.test(code)) {
      e.preventDefault();
      const index = Math.max(0, currentHoverRowIndex.value - 1);
      onHoverRow({ row: data.value[index], index, e }, { action: 'hover' });
    } else if (SPACE_REG.test(code) && props.activeRowType !== 'multiple') {
      const index = currentHoverRowIndex.value;
      onHoverRow({ row: data.value[index], index, e });
    }

    // 用于支持键盘默认的左右滚动，左右滚动时重置为undefined，其他情况下为0，支持键盘操作
    if (ARROW_LEFT_REG.test(code) || ARROW_RIGHT_REG.test(code)) {
      tableRefTabIndex.value = undefined;
    } else {
      tableRefTabIndex.value = 0;
    }
  };

  const addRowHoverKeyboardListener = () => {
    on(tableRef.value, 'keydown', keyboardDownListener);
  };

  const removeRowHoverKeyboardListener = () => {
    off(tableRef.value, 'keydown', keyboardDownListener);
  };

  return {
    hoverRow,
    needKeyboardRowHover,
    clearHoverRow,
    addRowHoverKeyboardListener,
    removeRowHoverKeyboardListener,
    tableRefTabIndex,
  };
}

export default useHoverKeyboardEvent;
