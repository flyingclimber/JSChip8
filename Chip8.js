/* 
    JSChip8 - A JavaScript Chip8 interpreter

    Copyright (C) 2012, Tomasz Finc <tomasz@gmail.com>
  
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
  
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
  
    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

var chip8RV = [];
var key = [];
var stack = [];
var memory = [];
var chip8Fontset = [];
var pc = 0;
var I = 0;
var opcode = 0;
var sp = 0;
var delayTimer = 0;
var soundTimer = 0;
var multiplier = 10;
var drawFlag = false;

chip8Fontset = [
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80  // F
];
var ROM;
var gfx = new Array(64 * 32);
var keypress = 0; // Current key press


function loadFile(evt) {
    var files = evt.target.files;

    var binaryHandle = new FileReader();
    binaryHandle.onload = function () {
        ROM = binaryHandle.result;
    };
    binaryHandle.readAsBinaryString(files[0]);
}

function main() {
    setupGraphics();

    initialize();

    setInterval(function () { chip8Cycle(); }, 1000 / 450);
    setInterval(function () { updateTimers(); }, 1000 / 18.2);
}

function initialize() {
    pc = 0x200;
    opcode = 0;
    I = 0;
    sp = 0;

    clearScreen();
    clearStack();
    clearRegisters();
    clearMemory();
    
    var i = 0;
    for (i = 0; i < 80; i++) { // Load font set
        memory[i] = chip8Fontset[i];
    }

    for (i = 0; i < ROM.length; i++ ) { // Load ROM
        memory[i + 512] = ROM.charCodeAt(i);
    }

    clearTimers();
}

function chip8Cycle() {
    decodeOpcode();
    if (this.drawFlag) {
        updateGraphics();
    }
}

function decodeOpcode() {

    opcode = memory[pc] << 8 | memory[pc + 1];

    //BEGIN OP CODES
    switch(opcode & 0xF000) {
        //All opcodes from http://en.wikipedia.org/wiki/CHIP-8
        case 0x0000:
            switch(opcode & 0x00FF) {
                case 0x00E0: //00E0	Clears the screen.
                    clearScreen();
                    pc += 2;
                    drawFlag = true;
                    break;
                case 0x00EE: //00EE	Returns from a subroutine.
                    --sp;
                    pc = stack[sp];
                    pc += 2;
                    break;
                default:
                    console.log("Unknown opcode 0x" + opcode.toString(16));
            }
            break;
        case 0x1000: //1NNN	Jumps to address NNN.
            pc = opcode & 0x0FFF;
            break;
        case 0x2000: //2NNN	Calls subroutine at NNN.
            stack[sp] = pc; //set the stack pointer *before* we jump
            ++sp; //increment so that we don't over writie it
            pc = opcode & 0x0FFF;
            break;
        case 0x3000: //3XNN	Skips the next instruction if VX equals NN.
            pc += ( chip8RV[(opcode & 0x0F00) >> 8] === ( opcode & 0x00FF ) ) ? 4 : 2;
            break;
        case 0x4000: //4XNN	Skips the next instruction if VX doesn't equal NN.
            pc += ( chip8RV[(opcode & 0x0F00) >> 8] !== ( opcode & 0x00FF ) ) ? 4 : 2;
            break;
        case 0x5000: //5XY0	Skips the next instruction if VX equals VY. 
            pc += ( chip8RV[(opcode & 0x0F00) >> 8] === chip8RV[(opcode & 0x00F0) >> 4] ) ? 4 : 2;
            break;
        case 0x6000: //6XNN	Sets VX to NN.
            chip8RV[(opcode & 0x0F00) >> 8] = (opcode & 0x00FF);
            pc += 2;
            break;
        case 0x7000: //7XNN	Adds NN to VX.
            chip8RV[(opcode & 0x0F00) >> 8] += (opcode & 0x00FF); //Does this need a carry?
            chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
            pc += 2;
            break;
        case 0x8000:
            switch(opcode & 0x000F) { //8XY0 Sets VX to the value of VY.
                case 0x0000:
                    chip8RV[(opcode & 0x0F00) >> 8] = chip8RV[(opcode & 0x00F0) >> 4];
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x0001: //8XY1  Sets VX to VX or VY.
                    chip8RV[(opcode & 0x0F00) >> 8] |= (chip8RV[(opcode & 0x00F0) >> 4]);
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x002: //8XY2	Sets VX to VX and VY.
                    chip8RV[(opcode & 0x0F00) >> 8] &= (chip8RV[(opcode & 0x00F0) >> 4]);
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x003: //8XY3	Sets VX to VX xor VY.
                    chip8RV[(opcode & 0x0F00) >> 8] ^= (chip8RV[(opcode & 0x00F0) >> 4]);
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x0004: //8XY4	Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                    chip8RV[0xF] = 
                        ((chip8RV[(opcode & 0x00F0) >> 4] + chip8RV[(opcode & 0x0F00) >> 8]) > 0xFF) ? 1 : 0;
                    chip8RV[(opcode & 0x0F00) >> 8] += chip8RV[(opcode & 0x00F0) >> 4];
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x0005: //8XY5	VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    chip8RV[0xF] =
                        ((chip8RV[(opcode & 0x0F00) >> 8] - chip8RV[(opcode & 0x00F0) >> 4]) < 0) ? 0 : 1;
                    chip8RV[(opcode & 0x0F00) >> 8] =
                        (chip8RV[(opcode & 0x0F00) >> 8] - chip8RV[(opcode & 0x00F0) >> 4]);
                    chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
                    pc += 2;
                    break;
                case 0x0006: //8XY6	Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                    chip8RV[0xF] = chip8RV[(opcode & 0x0F00) >> 8] & 0x1;
                    chip8RV[(opcode & 0x0F00) >> 8] >>= 1;
                    pc += 2;
                    break;
                case 0x0007: //8XY7	Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                    chip8RV[0xF] =
                        ((chip8RV[(opcode & 0x00F0) >> 4] - chip8RV[(opcode & 0x0F00) >> 8]) < 0) ? 0: 1;
                    chip8RV[(opcode & 0x0F00) >> 8] =
                        (chip8RV[(opcode & 0x00F0) >> 4] - chip8RV[(opcode & 0x0F00) >> 8]);
                    pc += 2;
                    break;
                case 0x000E: //8XYE	Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
                    chip8RV[0xF] = chip8RV[(opcode & 0x0F00) >> 8] >> 7;
                    chip8RV[(opcode & 0x0F00) >> 8] <<= 1;
                    pc += 2;
                    break;
                default:
                    console.log("Unknown opcode 0x" + opcode.toString(16));
            }
            break;
        case 0x9000: //9XY0	Skips the next instruction if VX doesn't equal VY.
            pc += ( chip8RV[(opcode & 0x0F00) >> 8] !== chip8RV[(opcode & 0x00F0) >> 4] ) ? 4 : 2;
            break;
        case 0xA000: //ANNN	Sets I to the address NNN.
            I = opcode & 0x0FFF;
            pc += 2;
            break;
        case 0xB000: //BNNN	Jumps to the address NNN plus V0.
            pc = (opcode & 0x0FFF) + chip8RV[0];
            break;
        case 0xC000: //CXNN	Sets VX to a random number and NN.
            chip8RV[(opcode & 0x0F00) >> 8] = Math.floor((Math.random()*255)+1) & (opcode & 0x00FF);
            chip8RV[(opcode & 0x0F00) >> 8] &= 0xFF;
            pc += 2;
            break;
        case 0xD000: //DXYN	Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte displayed on the left) starting from memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, and to 0 if that doesn't happen.
            var x = chip8RV[(opcode & 0x0F00) >> 8];
            var y = chip8RV[(opcode & 0x00F0) >> 4];
            var h = (opcode & 0x000F);
            var pixel = 0;

            chip8RV[0xF] = 0;
            for (var yline = 0; yline < h; yline++) {
                pixel = memory[I + yline];
                for ( var xline = 0; xline < 8; xline++) {
                    if ((pixel & (0x80 >> xline)) !== 0 ) {
                        if (gfx[(x + xline + ((y + yline) * 64))] === 1) {
                            chip8RV[0xF] = 1;
                        }
                        gfx[x + xline + ((y + yline) * 64)] ^= 1; 
                    }
                }
            }

            drawFlag = true;
            pc += 2;
            break;
        case 0xE000:
            switch(opcode & 0x000F) {
                case 0x000E: //EX9E	Skips the next instruction if the key stored in VX is pressed.
                    pc += ( key[parseInt(chip8RV[(opcode & 0x0F00) >> 8], 16)] === 1 ) ? 4: 2;
                    break;
                case 0x0001: //EXA1	Skips the next instruction if the key stored in VX isn't pressed.
                    pc += ( key[parseInt(chip8RV[(opcode & 0x0F00) >> 8], 16)] === 0 ) ? 4 : 2;
                    break;
            }
            break;
        case 0xF000:
            switch(opcode & 0x00FF) {
                case 0x0007: //FX07	Sets VX to the value of the delay timer.
                    chip8RV[(opcode & 0x0F00) >> 8] = delayTimer;
                    pc += 2;
                    break; 
                case 0x000A: //FX0A	A key press is awaited, and then stored in VX.
                    if (keypress !== 0) {
                        chip8RV[(opcode & 0x0F00) >> 8] = keypress;
                        pc += 2;
                    }
                    break;
                case 0x0015: //FX15	Sets the delay timer to VX.
                    delayTimer = chip8RV[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                case 0x0018: //FX18	Sets the sound timer to VX.
                    soundTimer = chip8RV[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                case 0x001E: //FX1E	Adds VX to I. Wikipedia tells me to set 0xF upon range overflow
                    chip8RV[0xF] = ( I + chip8RV[(opcode & 0x0F00) >> 8] > 0xFFF ) ? 1 : 0;
                    I += chip8RV[(opcode & 0x0F00) >> 8];
                    pc += 2;
                    break;
                case 0x0029: //FX29	Sets I to the location of the sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                    var character = chip8RV[(opcode & 0x0F00) >> 8];
                    I = parseInt(character, 16) * 5;
                    pc += 2;
                    break;
                case 0x0033: //FX33	Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2.
                    memory[I] = chip8RV[(opcode & 0x0F00) >> 8] / 100;
                    memory[I + 1] = (chip8RV[(opcode & 0x0F00) >> 8] / 10) % 10;
                    memory[I + 2] = (chip8RV[(opcode & 0x0F00) >> 8] % 100) % 10;
                    pc += 2;
                    break;
                case 0x0055: //FX55	Stores V0 to VX in memory starting at address I.
                    var reg = (opcode & 0x0F00) >> 8;
                    for (var i = 0; i <= reg; i++) {
                        memory[I + i] = chip8RV[i];
                    }
                    I += reg + 1;
                    pc += 2;
                    break;
                case 0x0065: //FX65	Fills V0 to VX with values from memory starting at address I 
                    reg = (opcode & 0x0F00) >> 8;
                    for (i = 0; i <= reg; i++) {
                        chip8RV[i] = memory[I + i];
                    }
                    I += reg + 1;
                    pc += 2;
                    break;
            }
            break;
        default:
            console.log("Unknown opcode 0x" + opcode.toString(16));
        } //END OPCODES

      }

function clearScreen() {
    for (var i = 0; i < gfx.length; i++) {
        gfx[i] = 0;
    }
}

function updateTimers() {
    if (delayTimer > 0) {
        delayTimer--;
    }
    if (soundTimer > 0) {
        if (soundTimer === 1) {
            console.log("BEEP!\n");
        }
        soundTimer--;
    }
}

function clearStack() {
    for (var i = 0; i < 16; i++) {
        stack[i] = 0;
    }
}

function clearRegisters() {
    for (var i = 0; i < 16; i++) {
        chip8RV[i] = 0;
    }
}

function clearMemory() {
    for (var i = 0; i < 4096; i++) {
        memory[i] = 0;
    }
}

function clearTimers() {
    delayTimer = 0;
    soundTimer = 0;
}

function keyDown(evt) {
    setKey(evt,1);
}

function keyUp(evt) {
    setKey(evt,0);
}

function setKey(evt,state) {
    switch(evt.keyCode) {
        case 49: // 1 ~ 1
            keypress = 0x1;
            break;
        case 50: // 2 ~ 2
            keypress = 0x2;
            break;
        case 51: // 3 ~ 3
            keypress = 0x3;
            break;
        case 52: // 4 ~ C
            keypress = 0xC;
            break;
        case 81: // q ~ 4
            keypress = 0x4;
            break;
        case 87: // w ~ 5
            keypress = 0x5;
            break;
        case 69: // e ~ 6
            keypress = 0x6;
            break;
        case 82: // r ~ D
            keypress = 0xD;
            break;
        case 65: // a ~ 7
            keypress = 0x7;
            break;
        case 83: // s ~ 8
            keypress = 0x8;
            break;
        case 68: // d ~ 9
            keypress = 0x9;
            break;
        case 70: // f ~ E
            keypress = 0xE;
            break;
        case 90: // z ~ A
            keypress = 0xA;
            break;
        case 88: // x ~ 0
            keypress = 0x0;
            break;
        case 67: // c ~ B
            keypress = 0xB;
            break;
        case 86: // v ~ F
            keypress = 0xF;
            break;
    }
    key[keypress] = state;
}

function setupGraphics() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgb(1,0,0)";
    ctx.scale(multiplier,multiplier);
    ctx.fillRect (0, 0, 64, 32);
}

function updateGraphics() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var y = 0;
    var x = 0;

    for (y = 0; y < 32; y++) {
        for (x = 0; x < 64; x++) {
            if (gfx[(64 * y) + x]) {
                ctx.fillStyle = "rgb(200,0,0)";
                ctx.fillRect(x,y,1,1);
            } else {
                ctx.fillStyle = "rgb(1,0,0)";
                ctx.fillRect(x,y,1,1);
            }
        }
    }
    drawFlag = false;
}
