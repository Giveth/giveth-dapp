import * as feathers from "feathers";

declare function hooks(): () => void;

declare module "feathers" {
    interface Service<T> {
        before(hooks: hooks.HookMap): Application;
        after(hooks: hooks.HookMap): Application;
        hooks(hooks: hooks.HooksObject): Application;
    }
    interface Application {
        hooks(hooks: hooks.HooksObject): Application;
    }
}

declare namespace hooks {
    interface Hook {
        <T>(hook: HookProps<T>): Promise<any> | void;
    }

    interface HookProps<T> {
        app?: feathers.Application;
        data?: T;
        error?: any;
        id?: string | number;
        method?: string;
        params?: any;
        path?: string;
        result?: T;
        service: feathers.Service<T>;
        type: "before" | "after" | "error";
    }

    interface HookMap {
        all?: Hook | Hook[];
        find?: Hook | Hook[];
        get?: Hook | Hook[];
        create?: Hook | Hook[];
        update?: Hook | Hook[];
        patch?: Hook | Hook[];
        remove?: Hook | Hook[];
    }

    interface HooksObject {
        before?: HookMap;
        after?: HookMap;
        error?: HookMap;
    }
}

export = hooks;
