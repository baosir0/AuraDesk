import mitt from 'mitt';

type Events = {
    'usr:clickorenter': string;
}

const emitter = mitt<Events>();

export default emitter;
export type emittertype = typeof emitter;