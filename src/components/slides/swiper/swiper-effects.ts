import { SlideEffects } from './swiper-interfaces';
import { CLS, eachChild, isHorizontal, transform, transition, triggerTransitionEnd } from './swiper-utils';
import { isIosUIWebView, isSafari } from '../../../platform/platform-utils';


/*=========================
  Effects
  ===========================*/
export const SWIPER_EFFECTS: SlideEffects = {
  'fade': {
    setTranslate: function (s) {
      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        let offset = slide.swiperSlideOffset;
        let tx = -offset;
        if (!s.virtualTranslate) {
          tx = tx - s._translate;
        }
        let ty = 0;
        if (!isHorizontal(s)) {
          ty = tx;
          tx = 0;
        }
        let slideOpacity = s.fade.crossFade ?
            Math.max(1 - Math.abs(slide.progress), 0) :
            1 + Math.min(Math.max(slide.progress, -1), 0);
        slide.style.opacity = <any>slideOpacity;
        transform(slide, 'translate3d(' + tx + 'px, ' + ty + 'px, 0px)');
      }
    },
    setTransition: function (s, plt, duration) {
      let slides = s._slides;
      for (let i = 0; i < slides.length; i++) {
        transition(slides[i], duration);
      }

      if (s.virtualTranslate && duration !== 0) {
        let eventTriggered = false;

        for (let i = 0; i < slides.length; i++) {
          plt.transitionEnd(slides[i], () => {
            if (eventTriggered || !s) return;

            eventTriggered = true;
            s._animating = false;

            triggerTransitionEnd(plt, s._wrapper);
          });
        }
      }
    }
  },

  'flip': {
    setTranslate: function (s, plt) {
      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        let progress = slide.progress;
        if (s.flip.limitRotation) {
          progress = Math.max(Math.min(slide.progress, 1), -1);
        }
        let offset = slide.swiperSlideOffset;
        let rotate = -180 * progress,
          rotateY = rotate,
          rotateX = 0,
          tx = -offset,
          ty = 0;
        if (!isHorizontal(s)) {
          ty = tx;
          tx = 0;
          rotateX = -rotateY;
          rotateY = 0;
        } else if (s._rtl) {
          rotateY = -rotateY;
        }

        slide.style.zIndex = <any>-Math.abs(Math.round(progress)) + s._slides.length;

        if (s.flip.slideShadows) {
          // Set shadows
          let shadowBefore = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-left') : slide.querySelector('.swiper-slide-shadow-top'));
          let shadowAfter = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-right') : slide.querySelector('.swiper-slide-shadow-bottom'));

          if (!shadowBefore) {
            shadowBefore = plt.doc().createElement('div');
            shadowBefore.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'left' : 'top');
            slide.appendChild(shadowBefore);
          }

          if (!shadowAfter) {
            shadowAfter = plt.doc().createElement('div');
            shadowAfter.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'right' : 'bottom');
            slide.appendChild(shadowAfter);
          }

          if (shadowBefore) {
            shadowBefore.style.opacity = <any>Math.max(-progress, 0);
          }
          if (shadowAfter) {
            shadowAfter.style.opacity = <any>Math.max(progress, 0);
          }
        }

        transform(slide, 'translate3d(' + tx + 'px, ' + ty + 'px, 0px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)');
      }
    },
    setTransition: function (s, plt, duration) {
      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        transition(slide, duration);
        eachChild(slide, '.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left', el => {
          transition(el, duration);
        });
      }

      if (s.virtualTranslate && duration !== 0) {
        let eventTriggered = false;
        plt.transitionEnd(s._slides[s._activeIndex], (ev) => {
          if (eventTriggered || !s) return;

          if (!(<HTMLElement>ev.target).classList.contains(CLS.slideActive)) {
            return;
          }

          eventTriggered = true;
          s._animating = false;

          triggerTransitionEnd(plt, s._wrapper);
        });
      }
    }
  },

  'cube': {
    setTranslate: function (s, plt) {
      let wrapperRotate = 0;
      let cubeShadow: HTMLElement;

      if (s.cube.shadow) {
        if (isHorizontal(s)) {
          cubeShadow = <HTMLElement>s._wrapper.querySelector('.swiper-cube-shadow');

          if (!cubeShadow) {
            cubeShadow = plt.doc().createElement('div');
            cubeShadow.className = 'swiper-cube-shadow';
            s._wrapper.appendChild(cubeShadow);
          }
          cubeShadow.style.height = s.renderedWidth + 'px';

        } else {
          cubeShadow = <HTMLElement>s.container.querySelector('.swiper-cube-shadow');
          if (!cubeShadow) {
            cubeShadow = plt.doc().createElement('div');
            cubeShadow.className = 'swiper-cube-shadow';
            s._wrapper.appendChild(cubeShadow);
          }
        }
      }

      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        let slideAngle = i * 90;
        let round = Math.floor(slideAngle / 360);
        if (s._rtl) {
          slideAngle = -slideAngle;
          round = Math.floor(-slideAngle / 360);
        }
        let progress = Math.max(Math.min(slide.progress, 1), -1);
        let tx = 0, ty = 0, tz = 0;
        if (i % 4 === 0) {
          tx = - round * 4 * s._renderedSize;
          tz = 0;
        } else if ((i - 1) % 4 === 0) {
          tx = 0;
          tz = - round * 4 * s._renderedSize;
        } else if ((i - 2) % 4 === 0) {
          tx = s._renderedSize + round * 4 * s._renderedSize;
          tz = s._renderedSize;
        } else if ((i - 3) % 4 === 0) {
          tx = - s._renderedSize;
          tz = 3 * s._renderedSize + s._renderedSize * 4 * round;
        }
        if (s._rtl) {
          tx = -tx;
        }

        if (!isHorizontal(s)) {
          ty = tx;
          tx = 0;
        }

        let transformStr = 'rotateX(' + (isHorizontal(s) ? 0 : -slideAngle) + 'deg) rotateY(' + (isHorizontal(s) ? slideAngle : 0) + 'deg) translate3d(' + tx + 'px, ' + ty + 'px, ' + tz + 'px)';
        if (progress <= 1 && progress > -1) {
          wrapperRotate = i * 90 + progress * 90;
          if (s._rtl) wrapperRotate = -i * 90 - progress * 90;
        }
        transform(slide, transformStr);

        if (s.cube.slideShadows) {
          // Set shadows
          let shadowBefore = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-left') : slide.querySelector('.swiper-slide-shadow-top'));
          let shadowAfter = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-right') : slide.querySelector('.swiper-slide-shadow-bottom'));

          if (!shadowBefore) {
            shadowBefore = plt.doc().createElement('div');
            shadowBefore.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'left' : 'top');
            slide.appendChild(shadowBefore);
          }

          if (!shadowAfter) {
            shadowAfter = plt.doc().createElement('div');
            shadowAfter.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'right' : 'bottom');
            slide.appendChild(shadowAfter);
          }

          if (shadowBefore) shadowBefore.style.opacity = <any>Math.max(-progress, 0);
          if (shadowAfter) shadowAfter.style.opacity = <any>Math.max(progress, 0);
        }
      }
      s._wrapper.style.transformOrigin = s._wrapper.style.webkitTransformOrigin = '50% 50% -' + (s._renderedSize / 2) + 'px';

      if (s.cube.shadow) {
        if (isHorizontal(s)) {
          transform(cubeShadow, 'translate3d(0px, ' + (s.renderedWidth / 2 + s.cube.shadowOffset) + 'px, ' + (-s.renderedWidth / 2) + 'px) rotateX(90deg) rotateZ(0deg) scale(' + (s.cube.shadowScale) + ')');

        } else {
          let shadowAngle = Math.abs(wrapperRotate) - Math.floor(Math.abs(wrapperRotate) / 90) * 90;
          let multiplier = 1.5 - (Math.sin(shadowAngle * 2 * Math.PI / 360) / 2 + Math.cos(shadowAngle * 2 * Math.PI / 360) / 2);
          let scale1 = s.cube.shadowScale;
          let scale2 = s.cube.shadowScale / multiplier;
          let offset = s.cube.shadowOffset;

          transform(cubeShadow, 'scale3d(' + scale1 + ', 1, ' + scale2 + ') translate3d(0px, ' + (s.renderedHeight / 2 + offset) + 'px, ' + (-s.renderedHeight / 2 / scale2) + 'px) rotateX(-90deg)');
        }
      }

      let zFactor = (isSafari(plt) || isIosUIWebView(plt)) ? (-s._renderedSize / 2) : 0;
      transform(s._wrapper, 'translate3d(0px,0,' + zFactor + 'px) rotateX(' + (isHorizontal(s) ? 0 : wrapperRotate) + 'deg) rotateY(' + (isHorizontal(s) ? -wrapperRotate : 0) + 'deg)');
    },
    setTransition: function (s, _plt, duration) {
      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        transition(slide, duration);
        eachChild(slide, '.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left', el => {
          transition(el, duration);
        });
      }

      if (s.cube.shadow && !isHorizontal(s)) {
        eachChild(s.container, '.swiper-cube-shadow', el => {
          transition(el, duration);
        });
      }
    }
  },

  'coverflow': {
    setTranslate: function (s, plt) {
      let transformStr = s._translate;
      let center = isHorizontal(s) ? -transformStr + s.renderedWidth / 2 : -transformStr + s.renderedHeight / 2;
      let rotate = isHorizontal(s) ? s.coverflow.rotate : -s.coverflow.rotate;
      let translate = s.coverflow.depth;

      // Each slide offset from center
      for (let i = 0, length = s._slides.length; i < length; i++) {
        let slide = s._slides[i];
        let slideSize = s._slidesSizesGrid[i];
        let slideOffset = slide.swiperSlideOffset;
        let offsetMultiplier = (center - slideOffset - slideSize / 2) / slideSize * s.coverflow.modifier;

        let rotateY = isHorizontal(s) ? rotate * offsetMultiplier : 0;
        let rotateX = isHorizontal(s) ? 0 : rotate * offsetMultiplier;
        // let rotateZ = 0
        let translateZ = -translate * Math.abs(offsetMultiplier);

        let translateY = isHorizontal(s) ? 0 : s.coverflow.stretch * (offsetMultiplier);
        let translateX = isHorizontal(s) ? s.coverflow.stretch * (offsetMultiplier) : 0;

        // Fix for ultra small values
        if (Math.abs(translateX) < 0.001) translateX = 0;
        if (Math.abs(translateY) < 0.001) translateY = 0;
        if (Math.abs(translateZ) < 0.001) translateZ = 0;
        if (Math.abs(rotateY) < 0.001) rotateY = 0;
        if (Math.abs(rotateX) < 0.001) rotateX = 0;

        let slideTransform = 'translate3d(' + translateX + 'px,' + translateY + 'px,' + translateZ + 'px)  rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';

        transform(slide, slideTransform);

        slide.style.zIndex = <any>-Math.abs(Math.round(offsetMultiplier)) + 1;

        if (s.coverflow.slideShadows) {
          // Set shadows
          let shadowBefore = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-left') : slide.querySelector('.swiper-slide-shadow-top'));
          let shadowAfter = <HTMLElement>(isHorizontal(s) ? slide.querySelector('.swiper-slide-shadow-right') : slide.querySelector('.swiper-slide-shadow-bottom'));

          if (!shadowBefore) {
            shadowBefore = plt.doc().createElement('div');
            shadowBefore.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'left' : 'top');
            slide.appendChild(shadowBefore);
          }

          if (!shadowAfter) {
            shadowAfter = plt.doc().createElement('div');
            shadowAfter.className = 'swiper-slide-shadow-' + (isHorizontal(s) ? 'right' : 'bottom');
            slide.appendChild(shadowAfter);
          }

          if (shadowBefore) {
            shadowBefore.style.opacity = <any>(offsetMultiplier > 0 ? offsetMultiplier : 0);
          }
          if (shadowAfter) {
            shadowAfter.style.opacity = <any>((-offsetMultiplier) > 0 ? -offsetMultiplier : 0);
          }
        }
      }
    },
    setTransition: function (s, _plt, duration) {
      for (let i = 0; i < s._slides.length; i++) {
        let slide = s._slides[i];
        transition(slide, duration);
        eachChild(slide, '.swiper-slide-shadow-top, .swiper-slide-shadow-right, .swiper-slide-shadow-bottom, .swiper-slide-shadow-left', (el) => {
          transition(el, duration);
        });
      }
    }
  }
};
