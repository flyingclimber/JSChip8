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

var Chip8 = {
    v: [], // Registers (16)
    stack: [],
    memory: [], // 4k max
    key: [], // Current key press
    gfx: [], // 64 x 32

    fontset: [
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
    ],

    pc: 0, // Program Counter
    I: 0,
    sp: 0, // Stack pointer

    rom: false,
    romIsBinary: false,
    drawFlag: false,

    delayTimer: 0,
    soundTimer: 0,
    
    initialize: function(ROM) {
        this.clearGfx();
        this.clearStack();
        this.clearRegisters();
        this.clearMemory();
        this.clearTimers();
        
        if (ROM) {
            Chip8.rom = ROM;
        }

        for (var i = 0; i < Chip8.rom.length; i++ ) { // Load ROM
            this.memory[i + 512] = 
                (Chip8.romIsBinary) ? Chip8.rom.charCodeAt(i) : Chip8.rom[i];
        }

        this.pc = 0x200;
    },

    cycle: function() {
        this.decodeOpcode();
        if (this.drawFlag) {
            updateGraphics();
        }
    },

    decodeOpcode: function() {

        var opcode = this.memory[this.pc] << 8 | this.memory[this.pc + 1];

        //BEGIN OP CODES
        switch(opcode & 0xF000) {
            //All opcodes from http://en.wikipedia.org/wiki/CHIP-8
            case 0x0000:
                switch(opcode & 0x00FF) {
                    case 0x00E0: //00E0	Clears the screen.
                        this.clearGfx();
                        this.pc += 2;
                        this.drawFlag = true;
                        break;
                    case 0x00EE: //00EE	Returns from a subroutine.
                        --this.sp;
                        this.pc = this.stack[this.sp];
                        this.pc += 2;
                        break;
                    default:
                        console.log("Unknown opcode 0x" + opcode.toString(16));
                }
                break;
            case 0x1000: //1NNN	Jumps to address NNN.
                this.pc = opcode & 0x0FFF;
                break;
            case 0x2000: //2NNN	Calls subroutine at NNN.
                this.stack[this.sp] = this.pc; //set the stack pointer *before* we jump
                ++this.sp; //increment so that we don't over writie it
                this.pc = opcode & 0x0FFF;
                break;
            case 0x3000: //3XNN	Skips the next instruction if VX equals NN.
                this.pc += ( this.v[(opcode & 0x0F00) >> 8] === ( opcode & 0x00FF ) ) ? 4 : 2;
                break;
            case 0x4000: //4XNN	Skips the next instruction if VX doesn't equal NN.
                this.pc += ( this.v[(opcode & 0x0F00) >> 8] !== ( opcode & 0x00FF ) ) ? 4 : 2;
                break;
            case 0x5000: //5XY0	Skips the next instruction if VX equals VY. 
                this.pc += ( this.v[(opcode & 0x0F00) >> 8] === this.v[(opcode & 0x00F0) >> 4] ) ? 4 : 2;
                break;
            case 0x6000: //6XNN	Sets VX to NN.
                this.v[(opcode & 0x0F00) >> 8] = (opcode & 0x00FF);
                this.pc += 2;
                break;
            case 0x7000: //7XNN	Adds NN to VX.
                this.v[(opcode & 0x0F00) >> 8] += (opcode & 0x00FF); //Does this need a carry?
                this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                this.pc += 2;
                break;
            case 0x8000:
                switch(opcode & 0x000F) { //8XY0 Sets VX to the value of VY.
                    case 0x0000:
                        this.v[(opcode & 0x0F00) >> 8] = this.v[(opcode & 0x00F0) >> 4];
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x0001: //8XY1  Sets VX to VX or VY.
                        this.v[(opcode & 0x0F00) >> 8] |= (this.v[(opcode & 0x00F0) >> 4]);
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x002: //8XY2	Sets VX to VX and VY.
                        this.v[(opcode & 0x0F00) >> 8] &= (this.v[(opcode & 0x00F0) >> 4]);
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x003: //8XY3	Sets VX to VX xor VY.
                        this.v[(opcode & 0x0F00) >> 8] ^= (this.v[(opcode & 0x00F0) >> 4]);
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x0004: //8XY4	Adds VY to VX. VF is set to 1 when there's a carry, and to 0 when there isn't.
                        this.v[0xF] = 
                            ((this.v[(opcode & 0x00F0) >> 4] + this.v[(opcode & 0x0F00) >> 8]) > 0xFF) ? 1 : 0;
                        this.v[(opcode & 0x0F00) >> 8] += this.v[(opcode & 0x00F0) >> 4];
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x0005: //8XY5	VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                        this.v[0xF] =
                            ((this.v[(opcode & 0x0F00) >> 8] - this.v[(opcode & 0x00F0) >> 4]) < 0) ? 0 : 1;
                        this.v[(opcode & 0x0F00) >> 8] =
                            (this.v[(opcode & 0x0F00) >> 8] - this.v[(opcode & 0x00F0) >> 4]);
                        this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                        this.pc += 2;
                        break;
                    case 0x0006: //8XY6	Shifts VX right by one. VF is set to the value of the least significant bit of VX before the shift.[2]
                        this.v[0xF] = this.v[(opcode & 0x0F00) >> 8] & 0x1;
                        this.v[(opcode & 0x0F00) >> 8] >>= 1;
                        this.pc += 2;
                        break;
                    case 0x0007: //8XY7	Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
                        this.v[0xF] =
                            ((this.v[(opcode & 0x00F0) >> 4] - this.v[(opcode & 0x0F00) >> 8]) < 0) ? 0: 1;
                        this.v[(opcode & 0x0F00) >> 8] =
                            (this.v[(opcode & 0x00F0) >> 4] - this.v[(opcode & 0x0F00) >> 8]);
                        this.pc += 2;
                        break;
                    case 0x000E: //8XYE	Shifts VX left by one. VF is set to the value of the most significant bit of VX before the shift.[2]
                        this.v[0xF] = this.v[(opcode & 0x0F00) >> 8] >> 7;
                        this.v[(opcode & 0x0F00) >> 8] <<= 1;
                        this.pc += 2;
                        break;
                    default:
                        console.log("Unknown opcode 0x" + opcode.toString(16));
                }
                break;
            case 0x9000: //9XY0	Skips the next instruction if VX doesn't equal VY.
                this.pc += ( this.v[(opcode & 0x0F00) >> 8] !== this.v[(opcode & 0x00F0) >> 4] ) ? 4 : 2;
                break;
            case 0xA000: //ANNN	Sets I to the address NNN.
                this.I = opcode & 0x0FFF;
                this.pc += 2;
                break;
            case 0xB000: //BNNN	Jumps to the address NNN plus V0.
                this.pc = (opcode & 0x0FFF) + this.v[0];
                break;
            case 0xC000: //CXNN	Sets VX to a random number and NN.
                this.v[(opcode & 0x0F00) >> 8] = Math.floor((Math.random()*255)+1) & (opcode & 0x00FF);
                this.v[(opcode & 0x0F00) >> 8] &= 0xFF;
                this.pc += 2;
                break;
            case 0xD000: //DXYN	Draws a this.sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. Each row of 8 pixels is read as bit-coded (with the most significant bit of each byte dithis.splayed on the left) starting from this.memory location I; I value doesn't change after the execution of this instruction. As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the this.sprite is drawn, and to 0 if that doesn't happen.
                var x = this.v[(opcode & 0x0F00) >> 8];
                var y = this.v[(opcode & 0x00F0) >> 4];
                var h = (opcode & 0x000F);
                var pixel = 0;

                this.v[0xF] = 0;
                for (var yline = 0; yline < h; yline++) {
                    pixel = this.memory[this.I + yline];
                    for ( var xline = 0; xline < 8; xline++) {
                        if ((pixel & (0x80 >> xline)) !== 0 ) {
                            if (this.gfx[(x + xline + ((y + yline) * 64))] === 1) {
                                this.v[0xF] = 1;
                            }
                            this.gfx[x + xline + ((y + yline) * 64)] ^= 1; 
                        }
                    }
                }

                this.drawFlag = true;
                this.pc += 2;
                break;
            case 0xE000:
                switch(opcode & 0x000F) {
                    case 0x000E: //EX9E	Skips the next instruction if the key stored in VX is pressed.
                        this.pc += ( this.key[parseInt(this.v[(opcode & 0x0F00) >> 8], 16)] === 1 ) ? 4: 2;
                        break;
                    case 0x0001: //EXA1	Skips the next instruction if the key stored in VX isn't pressed.
                        this.pc += ( this.key[parseInt(this.v[(opcode & 0x0F00) >> 8], 16)] === 0 ) ? 4 : 2;
                        break;
                }
                break;
            case 0xF000:
                switch(opcode & 0x00FF) {
                    case 0x0007: //FX07	Sets VX to the value of the delay timer.
                        this.v[(opcode & 0x0F00) >> 8] = this.delayTimer;
                        this.pc += 2;
                        break; 
                    case 0x000A: //FX0A	A key press is awaited, and then stored in VX.
                        if (keypress !== 0) {
                            this.v[(opcode & 0x0F00) >> 8] = keypress;
                            this.pc += 2;
                        }
                        break;
                    case 0x0015: //FX15	Sets the delay timer to VX.
                        this.delayTimer = this.v[(opcode & 0x0F00) >> 8];
                        this.pc += 2;
                        break;
                    case 0x0018: //FX18	Sets the sound timer to VX.
                        this.soundTimer = this.v[(opcode & 0x0F00) >> 8];
                        this.pc += 2;
                        break;
                    case 0x001E: //FX1E	Adds VX to I. Wikipedia tells me to set 0xF upon range overflow
                        this.v[0xF] = ( this.I + this.v[(opcode & 0x0F00) >> 8] > 0xFFF ) ? 1 : 0;
                        this.I += this.v[(opcode & 0x0F00) >> 8];
                        this.pc += 2;
                        break;
                    case 0x0029: //FX29	Sets I to the location of the this.sprite for the character in VX. Characters 0-F (in hexadecimal) are represented by a 4x5 font.
                        var character = this.v[(opcode & 0x0F00) >> 8];
                        this.I = parseInt(character, 16) * 5;
                        this.pc += 2;
                        break;
                    case 0x0033: //FX33	Stores the Binary-coded decimal representation of VX, with the most significant of three digits at the address in I, the middle digit at I plus 1, and the least significant digit at I plus 2.
                        this.memory[this.I] = this.v[(opcode & 0x0F00) >> 8] / 100;
                        this.memory[this.I + 1] = (this.v[(opcode & 0x0F00) >> 8] / 10) % 10;
                        this.memory[this.I + 2] = (this.v[(opcode & 0x0F00) >> 8] % 100) % 10;
                        this.pc += 2;
                        break;
                    case 0x0055: //FX55	Stores V0 to VX in this.memory starting at address I.
                        var reg = (opcode & 0x0F00) >> 8;
                        for (var i = 0; i <= reg; i++) {
                            this.memory[this.I + i] = this.v[i];
                        }
                        this.I += reg + 1;
                        this.pc += 2;
                        break;
                    case 0x0065: //FX65	Fills V0 to VX with values from this.memory starting at address I 
                        reg = (opcode & 0x0F00) >> 8;
                        for (i = 0; i <= reg; i++) {
                            this.v[i] = this.memory[this.I + i];
                        }
                        this.I += reg + 1;
                        this.pc += 2;
                        break;
                }
                break;
            default:
                console.log("Unknown opcode 0x" + opcode.toString(16));
            } //END OPCODES

    },

    clearGfx: function () {
        for (var i = 0; i < this.gfx.length; i++) {
            this.gfx[i] = 0;
        }
    },

    updateTimers: function() {
        if (this.delayTimer > 0) {
            this.delayTimer--;
        }
        if (this.soundTimer > 0) {
            if (this.soundTimer === 1) {
                console.log("BEEP!\n");
            }
            this.soundTimer--;
        }
    },

    clearStack: function() {
        for (var i = 0; i < 16; i++) {
            this.stack[i] = 0;
        }
    },

    clearRegisters: function() {
        for (var i = 0; i < 16; i++) {
            this.v[i] = 0;
        }
    },

    clearMemory: function() {
        for (var i = 0; i < 4096; i++) {
            this.memory[i] = 0;
        }
    },

    clearTimers: function() {
        this.delayTimer = 0;
        this.soundTimer = 0;
    }

};

var multiplier = 10;
var keypress = 0; // Current key press

function loadFile(evt) {
    var files = evt.target.files;

    var binaryHandle = new FileReader();
    binaryHandle.onload = function () {
        Chip8.rom = binaryHandle.result;
        Chip8.romIsBinary = true;
    };
    binaryHandle.readAsBinaryString(files[0]);
}

function main() {
    setupGraphics();

    Chip8.initialize();

    setInterval(function () { Chip8.cycle(); }, 1000 / 450);
    setInterval(function () { Chip8.updateTimers(); }, 1000 / 18.2);
}

function keyUp(evt) {
    setKey(evt,0);
}

function keyDown(evt) {
    setKey(evt,1);
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
    Chip8.key[keypress] = state;
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
            if (Chip8.gfx[(64 * y) + x]) {
                ctx.fillStyle = "rgb(200,0,0)";
                ctx.fillRect(x,y,1,1);
            } else {
                ctx.fillStyle = "rgb(1,0,0)";
                ctx.fillRect(x,y,1,1);
            }
        }
    }
    Chip8.drawFlag = false;
}
