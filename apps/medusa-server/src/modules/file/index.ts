import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CloudinaryFileService from "./service"

const services = [CloudinaryFileService]

export default ModuleProvider(Modules.FILE, {
  services,
})
