import { defineComponent, computed, inject, ref, onMounted } from '@vue/composition-api';
import { prefix } from '../config';
import props from '@TdTypes/menu-item/props';
import { TdMenuInterface, TdSubMenuInterface } from './const';
import Ripple from '../utils/ripple';
const name = `${prefix}-menu-item`;

export default defineComponent({
  name,
  props: { ...props },
  directives: { ripple: Ripple },
  setup(props, ctx) {
    const menu = inject<TdMenuInterface>('TdMenu');
    const submenu = inject<TdSubMenuInterface>('TdSubmenu', null);
    const active = computed(() => menu.activeIndexValue.value === props.value);
    const isDuringAnimation = ref(false);
    const classes = computed(() => [
      `${prefix}-menu__item`,
      {
        [`${prefix}-clicked`]: isDuringAnimation.value,
        [`${prefix}-is-active`]: active.value,
        [`${prefix}-is-disabled`]: props.disabled,
        [`${prefix}-menu__item--plain`]: !ctx.slots.icon,
        [`${prefix}-submenu__item`]: !!submenu && !menu.isHead,
        [`${prefix}-submenu__item--icon`]: submenu && submenu.hasIcon,
      },
    ]);
    // methods
    const handleClick = () => {
      if (props.disabled) return;
      menu.select(props.value);

      if (props.href) {
        window.open(props.href, props.target);
      } else if (props.to) {
        const router = props.router || (ctx.root as Record<string, any>).$router;
        const methods: string = props.replace ? 'replace' : 'push';
        router[methods](props.to).catch((err: Error) => {
          // vue-router 3.1.0+ push/replace cause NavigationDuplicated error
          // https://github.com/vuejs/vue-router/issues/2872
          // 当前path和目标path相同时，会抛出NavigationDuplicated的错误
          if (err.name !== 'NavigationDuplicated'
          && !err.message.includes('Avoided redundant navigation to current location')
          ) {
            throw (err);
          }
        });
      }
    };

    // lifetimes
    onMounted(() => {
      if (submenu) {
        submenu.addMenuItem({
          value: props.value,
          label: ctx.slots.default(),
        });
      }
    });

    return {
      menu,
      active,
      classes,
      handleClick,
    };
  },
  render() {
    return (
      <li v-ripple={this.menu.theme.value === 'light' ? '#E7E7E7' : '#383838'} class={this.classes} onClick={this.handleClick} ref="button">
        {this.$slots.icon}
        <span class={[`${prefix}-menu__content`]}>{this.$slots.default}</span>
      </li>
    );
  },
});
