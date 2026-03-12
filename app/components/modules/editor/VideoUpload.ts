// components/modules/editor/VideoUpload.ts
import { Node, mergeAttributes } from "@tiptap/core";
import type { CommandProps, NodeViewRenderer } from "@tiptap/core";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import VideoUploadNodeComponent from "./VideoUploadNode.vue";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoUpload: {
      insertVideoUpload: () => ReturnType;
    };
  }
}

export const VideoUpload = Node.create({
  name: "videoUpload",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      moduleId: { default: null },
      coursId: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="video-upload"]',
      },
      {
        tag: "video[src]",
        getAttrs: (node) => ({
          src: (node as HTMLElement).getAttribute("src"),
          moduleId: (node as HTMLElement).getAttribute("data-module-id"),
          coursId: (node as HTMLElement).getAttribute("data-cours-id"),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.src) {
      return [
        "video",
        mergeAttributes(
          {
            controls: true,
            style: "width: 100%; border-radius: 0.5rem; margin: 1rem 0;",
            "data-type": "video-upload",
            "data-module-id": HTMLAttributes.moduleId,
            "data-cours-id": HTMLAttributes.coursId,
          },
          { src: HTMLAttributes.src },
        ),
      ];
    }
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "video-upload" }),
    ];
  },

  addNodeView(): NodeViewRenderer {
    return VueNodeViewRenderer(VideoUploadNodeComponent);
  },

  addCommands() {
    return {
      insertVideoUpload:
        () =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({ type: this.name });
        },
    };
  },
});

export default VideoUpload;
