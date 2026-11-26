'use client';
import { useEffect } from 'react';

const VISIT_INTERVAL = 3 * 60 * 1000;
const ARRIVAL_DURATION = 5400;
const LANDING_DURATION = 1280;
const DEPARTURE_DURATION = 4300;
const PERCH_DURATION = 650;
const FIRE_DURATION = 1500;
const FOOT_LEVEL = 96 / 132;
const FRONT_TOUCHDOWN = .58;
const REAR_TOUCHDOWN = .74;
const LIFT_DURATION = 420;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const randomItem = items => items[Math.floor(Math.random() * items.length)];
const translate = ({ x, y }) => `translate3d(${x}px, ${y}px, 0)`;
const mix = (start, end, progress) => start + (end - start) * progress;
const smooth = t => t * t * (3 - 2 * t);
const slope = (bend, x) => (bend(x + 1) - bend(x - 1)) / 2;

function flightBounds(dragon) {
  const header = document.querySelector('.app-header')?.getBoundingClientRect();
  const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
  const rail = document.querySelector('.app-rail')?.getBoundingClientRect();
  const width = dragon.offsetWidth;
  const height = dragon.offsetHeight;
  const maxX = Math.max(0, window.innerWidth - width - 16);
  const maxY = Math.max(0, (nav?.height ? nav.top : window.innerHeight) - height - 16);
  return {
    width, height, maxX, maxY,
    minX: Math.min(maxX, Math.max(16, (rail?.right || 0) + 16)),
    minY: Math.min(maxY, Math.max(16, (header?.bottom || 0) + 12)),
  };
}

function paperPerch(paper, box) {
  if (!paper.isConnected) return null;
  const rect = paper.getBoundingClientRect();
  const left = Math.max(rect.left, box.minX);
  const right = Math.min(rect.right, box.maxX + box.width);
  const feet = Math.max(rect.top + 3, box.minY + box.height * FOOT_LEVEL);
  const y = feet - box.height * FOOT_LEVEL;
  if (right - left < box.width * .6 || rect.bottom - feet < 24 || y > box.maxY) return null;
  return { x: clamp((left + right - box.width) / 2, box.minX, box.maxX), y };
}

function choosePerch(box) {
  const papers = [...document.querySelectorAll('.app-main .sheet')].flatMap(paper => {
    const point = paperPerch(paper, box);
    return point ? [{ paper, point }] : [];
  });
  if (papers.length && Math.random() < .5) return randomItem(papers);
  const corners = [
    { x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY },
    { x: box.minX, y: box.maxY }, { x: box.maxX, y: box.maxY },
  ];
  return { point: randomItem(corners) };
}

function flightFrames(from, to, box) {
  const amplitude = Math.min(68, (box.maxY - box.minY) * .24);
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24;
    const wave = Math.sin(t * Math.PI * 4) * Math.sin(t * Math.PI);
    const x = from.x + (to.x - from.x) * t;
    const y = clamp(from.y + (to.y - from.y) * t + amplitude * wave, box.minY, box.maxY);
    const tilt = Math.cos(t * Math.PI * 4) * Math.sin(t * Math.PI) * 6 * Math.sign(to.x - from.x);
    return { transform: `${translate({ x, y })} rotate(${tilt}deg)` };
  });
}

function landingFrames(from, to, direction) {
  const dip = { x: mix(from.x, to.x, .77), y: mix(from.y, to.y, .44) };
  const origin = `50% ${FOOT_LEVEL * 100}%`;
  return [
    { offset: 0, transform: translate(from), easing: 'cubic-bezier(.23,.15,.55,.8)' },
    { offset: .32, transform: `${translate(dip)} rotate(${direction * 3}deg)`, easing: 'cubic-bezier(.2,.42,.45,1)' },
    { offset: FRONT_TOUCHDOWN, transform: translate(to) },
    { offset: 1, transform: translate(to) },
  ].map(frame => ({ ...frame, transformOrigin: origin }));
}

function landingLegPose(leg, progress) {
  const { x, y, toeX, toeY, groundY, front } = leg;
  const start = front ? 0 : .16;
  const contact = front ? FRONT_TOUCHDOWN : REAR_TOUCHDOWN;
  const reach = clamp((progress - start) / (contact - start), 0, 1);
  const planted = clamp((progress - contact) / (1 - contact), 0, 1);
  const swing = Math.sin(Math.PI * reach);
  const bend = Math.sin(Math.PI * planted);
  const dx = 7 * swing;
  const dy = (groundY - toeY) * smooth(reach) - (front ? 0 : 9 * swing);
  const angle = -18 * swing + 28 * bend;
  const radians = angle * Math.PI / 180;
  const shoulder = dy + (x - toeX) * Math.sin(radians) + (y - toeY) * (Math.cos(radians) - 1);
  return { x, shoulder, transform: `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${angle.toFixed(2)} ${toeX} ${toeY})` };
}

function bodyBend(points, x) {
  const index = points.findIndex(point => point.x >= x);
  if (index < 1) return points[index === 0 ? 0 : points.length - 1].shoulder;
  const left = points[index - 1];
  const right = points[index];
  return mix(left.shoulder, right.shoulder, smooth((x - left.x) / (right.x - left.x)));
}

function bindSpine(path) {
  const [[startX, startY], ...curves] = path.slice(1).split('C').map(group => group.split(' ').map(Number));
  return bend => {
    let previousX = startX;
    let result = `M${startX} ${(startY + bend(startX)).toFixed(2)}`;
    for (const [firstX, firstY, secondX, secondY, endX, endY] of curves) {
      // Bend each control point with its endpoint to keep the joins smooth.
      const first = firstY + bend(previousX) + (firstX - previousX) * slope(bend, previousX);
      const second = secondY + bend(endX) + (secondX - endX) * slope(bend, endX);
      result += `C${firstX} ${first.toFixed(2)} ${secondX} ${second.toFixed(2)} ${endX} ${(endY + bend(endX)).toFixed(2)}`;
      previousX = endX;
    }
    return result;
  };
}

function bindDragonBody(dragon) {
  const paths = [...dragon.querySelectorAll('[data-wave-path]')].map(path => {
    const rest = path.getAttribute('d');
    const curve = path.dataset.wavePath === 'spine' ? bindSpine(rest) : null;
    return { path, rest, curve };
  });
  const joints = [...dragon.querySelectorAll('[data-wave-joint]')].map(joint => {
    const [x, y] = joint.dataset.waveJoint.split(' ').map(Number);
    return { joint, x, y };
  });
  const legs = joints.filter(({ joint }) => joint.dataset.landingLeg).sort((a, b) => a.x - b.x).map(leg => {
    const [toeX, toeY, groundY] = leg.joint.dataset.landingToe.split(' ').map(Number);
    return { ...leg, toeX, toeY, groundY, front: leg.joint.dataset.landingLeg === 'front' };
  });
  const shadow = dragon.querySelector('.sk-dragon-perch-shadow');

  const draw = (bend, feet) => {
    for (const { path, rest, curve } of paths) {
      // The marked paths use absolute x/y pairs so the body and its markings bend together.
      const drawing = curve ? curve(bend) : rest.replace(/(\d+) (\d+)/g, (_, x, y) => `${x} ${(Number(y) + bend(Number(x))).toFixed(2)}`);
      path.setAttribute('d', drawing);
    }
    for (const { joint, x, y } of joints) {
      const foot = feet?.get(joint);
      if (foot) {
        joint.setAttribute('transform', foot);
        continue;
      }
      const tilt = Math.atan(slope(bend, x)) * 180 / Math.PI;
      joint.setAttribute('transform', `translate(0 ${bend(x).toFixed(2)}) rotate(${tilt.toFixed(2)} ${x} ${y})`);
    }
  };

  const land = progress => {
    const poses = legs.map(leg => landingLegPose(leg, progress));
    const [farRear, nearRear, nearFront, farFront] = poses;
    const grounded = smooth(clamp((progress - .24) / .5, 0, 1));
    const points = [
      { x: 53, shoulder: nearRear.shoulder * .42 }, farRear, nearRear,
      { x: 173, shoulder: -14 * grounded }, nearFront, farFront,
      { x: 256, shoulder: farFront.shoulder * .55 },
    ];
    draw(x => bodyBend(points, x), new Map(poses.map((pose, i) => [legs[i].joint, pose.transform])));
    const contact = clamp((progress - FRONT_TOUCHDOWN) / (REAR_TOUCHDOWN - FRONT_TOUCHDOWN), 0, 1);
    shadow.setAttribute('opacity', (.16 * contact).toFixed(2));
  };

  const pose = (elapsed, duration) => {
    const blend = clamp(Math.min(elapsed / 360, (duration - elapsed) / 500), 0, 1);
    draw(x => {
      const phase = (elapsed / 1250 + (x - 256) / 208) * Math.PI * 2;
      const amplitude = 5 + 15 * clamp((256 - x) / 200, 0, 1);
      return Math.sin(phase) * amplitude * blend;
    });
    shadow.setAttribute('opacity', '0');
  };

  return {
    pose,
    land,
    lift(elapsed, duration) {
      if (elapsed < LIFT_DURATION) land(1 - elapsed / LIFT_DURATION);
      else pose(elapsed - LIFT_DURATION, duration - LIFT_DURATION);
    },
    reset() {
      for (const { path, rest } of paths) path.setAttribute('d', rest);
      for (const { joint } of joints) joint.removeAttribute('transform');
      shadow.setAttribute('opacity', '0');
    },
  };
}

export function useDragonVisit(ref) {
  useEffect(() => {
    const dragon = ref.current;
    if (!dragon) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const body = bindDragonBody(dragon);
    let nextVisit = Date.now() + VISIT_INTERVAL;
    let visitTimer;
    let phaseTimer;
    let flight;
    let perch;
    let bodyFrame;

    const place = point => { dragon.style.transform = translate(point); };
    const stopBody = (finishPose = body.reset) => {
      window.cancelAnimationFrame(bodyFrame);
      finishPose();
    };
    const hide = () => {
      window.clearTimeout(phaseTimer);
      flight?.cancel();
      flight = null;
      stopBody();
      perch = null;
      dragon.hidden = true;
      delete dragon.dataset.phase;
      delete dragon.dataset.perch;
      delete dragon.dataset.react;
    };

    const move = ({ to, frames, duration, pose, finishPose, easing = 'linear' }, finish) => {
      if (motion.matches || !dragon.animate) {
        place(to);
        stopBody(finishPose);
        finish();
        return;
      }
      const animation = dragon.animate(frames, { duration, easing, fill: 'both' });
      flight = animation;
      const moveBody = () => {
        if (flight !== animation) return;
        pose(animation.currentTime ?? 0, duration);
        bodyFrame = window.requestAnimationFrame(moveBody);
      };
      bodyFrame = window.requestAnimationFrame(moveBody);
      animation.onfinish = () => {
        if (flight !== animation) return;
        place(to);
        animation.cancel();
        flight = null;
        stopBody(finishPose);
        finish();
      };
    };

    const fly = (from, to, box, duration, finish, pose = body.pose) => {
      place(from);
      move({ to, frames: flightFrames(from, to, box), duration, pose, easing: 'cubic-bezier(.34, .04, .62, 1)' }, finish);
    };

    const followPaper = () => {
      if (!perch?.paper || !['landed', 'fire'].includes(dragon.dataset.phase)) return;
      const point = paperPerch(perch.paper, flightBounds(dragon));
      if (!point) { hide(); return; }
      perch.point = point;
      place(point);
    };

    const visit = () => {
      hide();
      dragon.hidden = false;
      const box = flightBounds(dragon);
      perch = choosePerch(box);
      const rightward = perch.point.x >= (box.minX + box.maxX) / 2;
      const direction = rightward ? 1 : -1;
      const approach = {
        x: perch.point.x - direction * Math.min(34, box.width * .12),
        y: Math.max(0, perch.point.y - Math.min(46, box.height * .42)),
      };
      const approachBox = { ...box, minY: Math.min(box.minY, approach.y) };
      const leftEdge = -box.width - 24;
      const rightEdge = window.innerWidth + 24;
      const cruiseY = box.minY + (box.maxY - box.minY) * .28;
      dragon.dataset.direction = rightward ? 'right' : 'left';
      dragon.dataset.perch = perch.paper ? 'paper' : 'corner';
      dragon.dataset.phase = 'arriving';
      const afterLanding = () => {
        dragon.dataset.phase = 'landed';
        followPaper();
        if (dragon.hidden) return;
        phaseTimer = window.setTimeout(() => {
          dragon.dataset.phase = 'fire';
          phaseTimer = window.setTimeout(() => {
            dragon.dataset.phase = 'departing';
            fly(perch.point, { x: rightward ? rightEdge : leftEdge, y: cruiseY }, box, DEPARTURE_DURATION, hide, body.lift);
          }, FIRE_DURATION);
        }, PERCH_DURATION);
      };
      fly({ x: rightward ? leftEdge : rightEdge, y: cruiseY }, approach, approachBox, ARRIVAL_DURATION, () => {
        const target = perch.paper ? paperPerch(perch.paper, box) : perch.point;
        if (!target) { hide(); return; }
        perch.point = target;
        dragon.dataset.phase = 'landing';
        move({
          to: target, frames: landingFrames(approach, target, direction), duration: LANDING_DURATION,
          pose: (elapsed, duration) => body.land(elapsed / duration), finishPose: () => body.land(1),
        }, afterLanding);
      });
    };

    const schedule = () => {
      window.clearTimeout(visitTimer);
      if (document.hidden) { hide(); return; }
      visitTimer = window.setTimeout(() => {
        nextVisit = Date.now() + VISIT_INTERVAL;
        if (!document.hidden) visit();
        schedule();
      }, Math.max(0, nextVisit - Date.now()));
    };

    schedule();
    document.addEventListener('visibilitychange', schedule);
    window.addEventListener('resize', hide);
    window.addEventListener('scroll', followPaper, true);
    motion.addEventListener('change', hide);
    return () => {
      window.clearTimeout(visitTimer);
      document.removeEventListener('visibilitychange', schedule);
      window.removeEventListener('resize', hide);
      window.removeEventListener('scroll', followPaper, true);
      motion.removeEventListener('change', hide);
      hide();
    };
  }, [ref]);
}
