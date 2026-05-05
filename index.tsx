/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {createRoot} from 'react-dom/client'
import IdeaSpaceApp from './src/IdeaSpaceApp'
import '@tailwindcss/browser'
import './main.css'

createRoot(document.getElementById('root')!).render(<IdeaSpaceApp />)
